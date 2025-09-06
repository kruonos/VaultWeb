import { users, folders, files, shareLinks, auditLogs, type User, type InsertUser, type Folder, type InsertFolder, type File, type InsertFile, type ShareLink, type InsertShareLink, type AuditLog, type InsertAuditLog } from "@shared/schema";
import { db } from "./db";
import { eq, and, isNull, desc, like, or, inArray } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getFolderById(id: string): Promise<Folder | undefined>;
  getFoldersByParent(parentId: string | null, ownerId: string): Promise<Folder[]>;
  createFolder(folder: InsertFolder & { ownerId: string }): Promise<Folder>;
  updateFolder(id: string, updates: Partial<Folder>): Promise<Folder | undefined>;
  deleteFolder(id: string): Promise<void>;
  
  getFileById(id: string): Promise<File | undefined>;
  getFilesByFolder(folderId: string | null, ownerId: string): Promise<File[]>;
  createFile(file: InsertFile & { ownerId: string }): Promise<File>;
  updateFile(id: string, updates: Partial<File>): Promise<File | undefined>;
  deleteFile(id: string): Promise<void>;
  searchFiles(query: string, ownerId: string, filters?: { type?: string; ext?: string }): Promise<File[]>;
  
  getShareLink(id: string): Promise<ShareLink | undefined>;
  createShareLink(shareLink: InsertShareLink & { createdBy: string }): Promise<ShareLink>;
  deleteShareLink(id: string): Promise<void>;
  
  createAuditLog(log: InsertAuditLog & { userId: string }): Promise<AuditLog>;
  getAuditLogs(userId: string, limit?: number): Promise<AuditLog[]>;
  
  getTrashItems(ownerId: string): Promise<{ files: File[]; folders: Folder[] }>;
  restoreFromTrash(id: string, type: 'file' | 'folder'): Promise<void>;
  permanentlyDelete(id: string, type: 'file' | 'folder'): Promise<void>;

  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getFolderById(id: string): Promise<Folder | undefined> {
    const [folder] = await db.select().from(folders).where(eq(folders.id, id));
    return folder || undefined;
  }

  async getFoldersByParent(parentId: string | null, ownerId: string): Promise<Folder[]> {
    return await db.select().from(folders).where(
      and(
        parentId ? eq(folders.parentId, parentId) : isNull(folders.parentId),
        eq(folders.ownerId, ownerId),
        isNull(folders.deletedAt)
      )
    ).orderBy(folders.name);
  }

  async createFolder(folder: InsertFolder & { ownerId: string }): Promise<Folder> {
    const [newFolder] = await db
      .insert(folders)
      .values(folder)
      .returning();
    return newFolder;
  }

  async updateFolder(id: string, updates: Partial<Folder>): Promise<Folder | undefined> {
    const [folder] = await db
      .update(folders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(folders.id, id))
      .returning();
    return folder || undefined;
  }

  async deleteFolder(id: string): Promise<void> {
    await db
      .update(folders)
      .set({ deletedAt: new Date() })
      .where(eq(folders.id, id));
  }

  async getFileById(id: string): Promise<File | undefined> {
    const [file] = await db.select().from(files).where(eq(files.id, id));
    return file || undefined;
  }

  async getFilesByFolder(folderId: string | null, ownerId: string): Promise<File[]> {
    return await db.select().from(files).where(
      and(
        folderId ? eq(files.folderId, folderId) : isNull(files.folderId),
        eq(files.ownerId, ownerId),
        isNull(files.deletedAt)
      )
    ).orderBy(files.name);
  }

  async createFile(file: InsertFile & { ownerId: string }): Promise<File> {
    const [newFile] = await db
      .insert(files)
      .values(file)
      .returning();
    return newFile;
  }

  async updateFile(id: string, updates: Partial<File>): Promise<File | undefined> {
    const [file] = await db
      .update(files)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(files.id, id))
      .returning();
    return file || undefined;
  }

  async deleteFile(id: string): Promise<void> {
    await db
      .update(files)
      .set({ deletedAt: new Date() })
      .where(eq(files.id, id));
  }

  async searchFiles(query: string, ownerId: string, filters?: { type?: string; ext?: string }): Promise<File[]> {
    let conditions = [
      eq(files.ownerId, ownerId),
      isNull(files.deletedAt),
      like(files.name, `%${query}%`)
    ];

    if (filters?.ext) {
      conditions.push(eq(files.ext, filters.ext));
    }

    if (filters?.type) {
      const typePatterns = {
        'image': ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
        'video': ['mp4', 'mov', 'avi', 'mkv', 'webm'],
        'audio': ['mp3', 'wav', 'ogg', 'm4a', 'flac'],
        'document': ['pdf', 'doc', 'docx', 'txt', 'rtf'],
        'archive': ['zip', 'rar', '7z', 'tar', 'gz']
      };
      
      const exts = typePatterns[filters.type as keyof typeof typePatterns];
      if (exts) {
        conditions.push(inArray(files.ext, exts));
      }
    }

    return await db.select().from(files).where(and(...conditions)).orderBy(files.name);
  }

  async getShareLink(id: string): Promise<ShareLink | undefined> {
    const [shareLink] = await db.select().from(shareLinks).where(eq(shareLinks.id, id));
    return shareLink || undefined;
  }

  async createShareLink(shareLink: InsertShareLink & { createdBy: string }): Promise<ShareLink> {
    const [newShareLink] = await db
      .insert(shareLinks)
      .values(shareLink)
      .returning();
    return newShareLink;
  }

  async deleteShareLink(id: string): Promise<void> {
    await db.delete(shareLinks).where(eq(shareLinks.id, id));
  }

  async createAuditLog(log: InsertAuditLog & { userId: string }): Promise<AuditLog> {
    const [newLog] = await db
      .insert(auditLogs)
      .values(log)
      .returning();
    return newLog;
  }

  async getAuditLogs(userId: string, limit: number = 50): Promise<AuditLog[]> {
    return await db.select().from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }

  async getTrashItems(ownerId: string): Promise<{ files: File[]; folders: Folder[] }> {
    const trashedFiles = await db.select().from(files).where(
      and(
        eq(files.ownerId, ownerId),
        isNull(files.deletedAt) === false
      )
    ).orderBy(desc(files.deletedAt));

    const trashedFolders = await db.select().from(folders).where(
      and(
        eq(folders.ownerId, ownerId),
        isNull(folders.deletedAt) === false
      )
    ).orderBy(desc(folders.deletedAt));

    return { files: trashedFiles, folders: trashedFolders };
  }

  async restoreFromTrash(id: string, type: 'file' | 'folder'): Promise<void> {
    if (type === 'file') {
      await db
        .update(files)
        .set({ deletedAt: null, updatedAt: new Date() })
        .where(eq(files.id, id));
    } else {
      await db
        .update(folders)
        .set({ deletedAt: null, updatedAt: new Date() })
        .where(eq(folders.id, id));
    }
  }

  async permanentlyDelete(id: string, type: 'file' | 'folder'): Promise<void> {
    if (type === 'file') {
      await db.delete(files).where(eq(files.id, id));
    } else {
      await db.delete(folders).where(eq(folders.id, id));
    }
  }
}

export const storage = new DatabaseStorage();
