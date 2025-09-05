import { storage } from "../storage";
import { storageService } from "./s3Service";
import crypto from "crypto";
import path from "path";

export interface FileUploadResult {
  fileId: string;
  storageKey: string;
}

export interface UploadInitResponse {
  uploadId: string;
  presignedUrls: string[];
  fileId: string;
}

export class FileService {
  generateStorageKey(ownerId: string, filename: string): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const uuid = crypto.randomUUID();
    const ext = path.extname(filename);
    
    return `${ownerId}/${year}/${month}/${day}/${uuid}${ext}`;
  }

  calculateChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  getMimeTypeFromExtension(ext: string): string {
    const mimeTypes: Record<string, string> = {
      // Images
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      
      // Videos
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.avi': 'video/x-msvideo',
      '.mkv': 'video/x-matroska',
      '.webm': 'video/webm',
      
      // Audio
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.m4a': 'audio/mp4',
      '.flac': 'audio/flac',
      
      // Documents
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain',
      '.rtf': 'application/rtf',
      
      // Archives
      '.zip': 'application/zip',
      '.rar': 'application/vnd.rar',
      '.7z': 'application/x-7z-compressed',
      '.tar': 'application/x-tar',
      '.gz': 'application/gzip',
      
      // Code
      '.js': 'text/javascript',
      '.ts': 'text/typescript',
      '.tsx': 'text/typescript',
      '.jsx': 'text/javascript',
      '.html': 'text/html',
      '.css': 'text/css',
      '.json': 'application/json',
    };

    return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
  }

  async initializeUpload(
    filename: string,
    size: number,
    ownerId: string,
    folderId?: string
  ): Promise<UploadInitResponse> {
    const ext = path.extname(filename);
    const mime = this.getMimeTypeFromExtension(ext);
    const storageKey = this.generateStorageKey(ownerId, filename);

    // Create file record
    const file = await storage.createFile({
      name: path.basename(filename, ext),
      ext: ext.slice(1), // Remove the dot
      mime,
      size,
      storageKey,
      ownerId,
      folderId: folderId || null,
    });

    // Create multipart upload
    const { uploadId, urls } = await storageService.createMultipartUpload(storageKey, mime);

    // Create audit log
    await storage.createAuditLog({
      userId: ownerId,
      action: "file_upload_initiated",
      targetType: "file",
      targetId: file.id,
      meta: { filename, size, storageKey },
    });

    return {
      uploadId,
      presignedUrls: urls,
      fileId: file.id,
    };
  }

  async completeUpload(
    fileId: string,
    uploadId: string,
    parts: { ETag: string; PartNumber: number }[]
  ): Promise<FileUploadResult> {
    const file = await storage.getFileById(fileId);
    if (!file) {
      throw new Error("File not found");
    }

    await storageService.completeMultipartUpload(file.storageKey, uploadId, parts);

    // Create audit log
    await storage.createAuditLog({
      userId: file.ownerId,
      action: "file_uploaded",
      targetType: "file",
      targetId: file.id,
      meta: { storageKey: file.storageKey },
    });

    return {
      fileId: file.id,
      storageKey: file.storageKey,
    };
  }

  async uploadLocal(
    filename: string,
    buffer: Buffer,
    ownerId: string,
    folderId?: string
  ): Promise<FileUploadResult> {
    const ext = path.extname(filename);
    const mime = this.getMimeTypeFromExtension(ext);
    const storageKey = this.generateStorageKey(ownerId, filename);
    const checksum = this.calculateChecksum(buffer);

    // Upload to storage
    await storageService.uploadFile(storageKey, buffer, mime);

    // Create file record
    const file = await storage.createFile({
      name: path.basename(filename, ext),
      ext: ext.slice(1), // Remove the dot
      mime,
      size: buffer.length,
      storageKey,
      checksum,
      ownerId,
      folderId: folderId || null,
    });

    // Create audit log
    await storage.createAuditLog({
      userId: ownerId,
      action: "file_uploaded",
      targetType: "file",
      targetId: file.id,
      meta: { filename, size: buffer.length, storageKey },
    });

    return {
      fileId: file.id,
      storageKey: file.storageKey,
    };
  }

  async getDownloadUrl(fileId: string): Promise<string> {
    const file = await storage.getFileById(fileId);
    if (!file) {
      throw new Error("File not found");
    }

    return await storageService.getSignedDownloadUrl(file.storageKey);
  }

  async deleteFile(fileId: string, ownerId: string): Promise<void> {
    const file = await storage.getFileById(fileId);
    if (!file) {
      throw new Error("File not found");
    }

    if (file.ownerId !== ownerId) {
      throw new Error("Unauthorized");
    }

    // Soft delete
    await storage.deleteFile(fileId);

    // Create audit log
    await storage.createAuditLog({
      userId: ownerId,
      action: "file_deleted",
      targetType: "file",
      targetId: fileId,
      meta: { filename: file.name, storageKey: file.storageKey },
    });
  }

  async permanentlyDeleteFile(fileId: string, ownerId: string): Promise<void> {
    const file = await storage.getFileById(fileId);
    if (!file) {
      throw new Error("File not found");
    }

    if (file.ownerId !== ownerId) {
      throw new Error("Unauthorized");
    }

    // Delete from storage
    try {
      await storageService.deleteFile(file.storageKey);
    } catch (error) {
      console.error("Failed to delete file from storage:", error);
    }

    // Permanently delete from database
    await storage.permanentlyDelete(fileId, "file");

    // Create audit log
    await storage.createAuditLog({
      userId: ownerId,
      action: "file_permanently_deleted",
      targetType: "file",
      targetId: fileId,
      meta: { filename: file.name, storageKey: file.storageKey },
    });
  }
}

export const fileService = new FileService();
