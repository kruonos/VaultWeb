import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export interface StorageService {
  uploadFile(key: string, buffer: Buffer, contentType: string): Promise<void>;
  getFile(key: string): Promise<Buffer>;
  deleteFile(key: string): Promise<void>;
  getSignedUploadUrl(key: string, contentType: string): Promise<string>;
  getSignedDownloadUrl(key: string): Promise<string>;
  createMultipartUpload(key: string, contentType: string): Promise<{ uploadId: string; urls: string[] }>;
  completeMultipartUpload(key: string, uploadId: string, parts: { ETag: string; PartNumber: number }[]): Promise<void>;
}

class S3StorageService implements StorageService {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.client = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    });
    this.bucket = process.env.S3_BUCKET!;
  }

  async uploadFile(key: string, buffer: Buffer, contentType: string): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });
    await this.client.send(command);
  }

  async getFile(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    const response = await this.client.send(command);
    const chunks: Uint8Array[] = [];
    const stream = response.Body as any;
    
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    
    return Buffer.concat(chunks);
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    await this.client.send(command);
  }

  async getSignedUploadUrl(key: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.client, command, { expiresIn: 3600 });
  }

  async getSignedDownloadUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.client, command, { expiresIn: 3600 });
  }

  async createMultipartUpload(key: string, contentType: string): Promise<{ uploadId: string; urls: string[] }> {
    const createCommand = new CreateMultipartUploadCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    
    const { UploadId } = await this.client.send(createCommand);
    
    const urls: string[] = [];
    for (let partNumber = 1; partNumber <= 10; partNumber++) {
      const uploadPartCommand = new UploadPartCommand({
        Bucket: this.bucket,
        Key: key,
        PartNumber: partNumber,
        UploadId,
      });
      
      const url = await getSignedUrl(this.client, uploadPartCommand, { expiresIn: 3600 });
      urls.push(url);
    }

    return { uploadId: UploadId!, urls };
  }

  async completeMultipartUpload(key: string, uploadId: string, parts: { ETag: string; PartNumber: number }[]): Promise<void> {
    const command = new CompleteMultipartUploadCommand({
      Bucket: this.bucket,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    });
    await this.client.send(command);
  }
}

class LocalStorageService implements StorageService {
  private basePath: string;

  constructor() {
    this.basePath = process.env.LOCAL_STORAGE_PATH || "/data/storage";
  }

  private getFilePath(key: string): string {
    return path.join(this.basePath, key);
  }

  async uploadFile(key: string, buffer: Buffer): Promise<void> {
    const filePath = this.getFilePath(key);
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, buffer);
  }

  async getFile(key: string): Promise<Buffer> {
    const filePath = this.getFilePath(key);
    return await fs.readFile(filePath);
  }

  async deleteFile(key: string): Promise<void> {
    const filePath = this.getFilePath(key);
    await fs.unlink(filePath);
  }

  async getSignedUploadUrl(key: string): Promise<string> {
    return `/api/upload/local/${key}`;
  }

  async getSignedDownloadUrl(key: string): Promise<string> {
    return `/api/files/download/${key}`;
  }

  async createMultipartUpload(key: string): Promise<{ uploadId: string; urls: string[] }> {
    const uploadId = randomUUID();
    const urls = Array.from({ length: 10 }, (_, i) => 
      `/api/upload/local/${key}/part/${i + 1}?uploadId=${uploadId}`
    );
    return { uploadId, urls };
  }

  async completeMultipartUpload(): Promise<void> {
    // Local storage doesn't need multipart completion
  }
}

export const storageService: StorageService = 
  process.env.STORAGE_DRIVER === "s3" 
    ? new S3StorageService()
    : new LocalStorageService();
