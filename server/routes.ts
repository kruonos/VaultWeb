import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { fileService } from "./services/fileService";
import { storageService } from "./services/s3Service";
import multer from "multer";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { randomUUID } from "crypto";
import archiver from "archiver";

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: "Too many authentication attempts, please try again later",
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 uploads per minute
});

// Multer setup for local uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});

// Middleware to require authentication
function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply auth rate limiting to auth routes
  app.use("/api/login", authLimiter);
  app.use("/api/register", authLimiter);
  
  // Setup authentication routes
  setupAuth(app);

  // Folder routes
  app.get("/api/folders/:id", requireAuth, async (req, res) => {
    try {
      const folder = await storage.getFolderById(req.params.id);
      if (!folder || folder.ownerId !== req.user!.id) {
        return res.status(404).json({ message: "Folder not found" });
      }
      res.json(folder);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/folders", requireAuth, async (req, res) => {
    try {
      const { parent } = req.query;
      const folders = await storage.getFoldersByParent(
        parent as string || null,
        req.user!.id
      );
      res.json(folders);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/folders", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        name: z.string().min(1).max(255),
        parentId: z.string().optional(),
      });
      
      const { name, parentId } = schema.parse(req.body);
      
      const folder = await storage.createFolder({
        name,
        parentId: parentId || null,
        ownerId: req.user!.id,
      });

      await storage.createAuditLog({
        userId: req.user!.id,
        action: "folder_created",
        targetType: "folder",
        targetId: folder.id,
        meta: { name, parentId },
      });

      res.status(201).json(folder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/folders/:id", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        name: z.string().min(1).max(255).optional(),
        parentId: z.string().optional(),
      });
      
      const updates = schema.parse(req.body);
      const folder = await storage.getFolderById(req.params.id);
      
      if (!folder || folder.ownerId !== req.user!.id) {
        return res.status(404).json({ message: "Folder not found" });
      }

      const updatedFolder = await storage.updateFolder(req.params.id, updates);

      await storage.createAuditLog({
        userId: req.user!.id,
        action: "folder_updated",
        targetType: "folder",
        targetId: req.params.id,
        meta: { updates },
      });

      res.json(updatedFolder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/folders/:id", requireAuth, async (req, res) => {
    try {
      const folder = await storage.getFolderById(req.params.id);
      if (!folder || folder.ownerId !== req.user!.id) {
        return res.status(404).json({ message: "Folder not found" });
      }

      await storage.deleteFolder(req.params.id);

      await storage.createAuditLog({
        userId: req.user!.id,
        action: "folder_deleted",
        targetType: "folder",
        targetId: req.params.id,
        meta: { name: folder.name },
      });

      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // File routes
  app.get("/api/files/:id", requireAuth, async (req, res) => {
    try {
      const file = await storage.getFileById(req.params.id);
      if (!file || file.ownerId !== req.user!.id) {
        return res.status(404).json({ message: "File not found" });
      }
      res.json(file);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/files", requireAuth, async (req, res) => {
    try {
      const { folder } = req.query;
      const files = await storage.getFilesByFolder(
        folder as string || null,
        req.user!.id
      );
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/files/:id", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        name: z.string().min(1).max(255).optional(),
        folderId: z.string().optional(),
      });
      
      const updates = schema.parse(req.body);
      const file = await storage.getFileById(req.params.id);
      
      if (!file || file.ownerId !== req.user!.id) {
        return res.status(404).json({ message: "File not found" });
      }

      const updatedFile = await storage.updateFile(req.params.id, updates);

      await storage.createAuditLog({
        userId: req.user!.id,
        action: "file_updated",
        targetType: "file",
        targetId: req.params.id,
        meta: { updates },
      });

      res.json(updatedFile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/files/:id", requireAuth, async (req, res) => {
    try {
      await fileService.deleteFile(req.params.id, req.user!.id);
      res.sendStatus(204);
    } catch (error) {
      if ((error as Error).message === "File not found") {
        return res.status(404).json({ message: "File not found" });
      }
      if ((error as Error).message === "Unauthorized") {
        return res.status(403).json({ message: "Unauthorized" });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Upload routes
  app.post("/api/upload/init", requireAuth, uploadLimiter, async (req, res) => {
    try {
      const schema = z.object({
        filename: z.string().min(1),
        size: z.number().positive(),
        folderId: z.string().optional(),
      });
      
      const { filename, size, folderId } = schema.parse(req.body);
      
      const result = await fileService.initializeUpload(
        filename,
        size,
        req.user!.id,
        folderId
      );

      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/upload/complete", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        fileId: z.string(),
        uploadId: z.string(),
        parts: z.array(z.object({
          ETag: z.string(),
          PartNumber: z.number(),
        })),
      });
      
      const { fileId, uploadId, parts } = schema.parse(req.body);
      
      const result = await fileService.completeUpload(fileId, uploadId, parts);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/upload/local", requireAuth, uploadLimiter, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }

      const { folderId } = req.body;
      
      const result = await fileService.uploadLocal(
        req.file.originalname,
        req.file.buffer,
        req.user!.id,
        folderId
      );

      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Download route
  app.get("/api/files/:id/download", requireAuth, async (req, res) => {
    try {
      const file = await storage.getFileById(req.params.id);
      if (!file || file.ownerId !== req.user!.id) {
        return res.status(404).json({ message: "File not found" });
      }

      if (process.env.STORAGE_DRIVER === "s3") {
        const downloadUrl = await fileService.getDownloadUrl(req.params.id);
        res.redirect(downloadUrl);
      } else {
        // Stream file from local storage
        const fileBuffer = await storageService.getFile(file.storageKey);
        res.setHeader("Content-Type", file.mime);
        res.setHeader("Content-Disposition", `attachment; filename="${file.name}.${file.ext}"`);
        res.setHeader("Content-Length", file.size);
        res.send(fileBuffer);
      }

      await storage.createAuditLog({
        userId: req.user!.id,
        action: "file_downloaded",
        targetType: "file",
        targetId: req.params.id,
        meta: { filename: `${file.name}.${file.ext}` },
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Search route
  app.get("/api/search", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        q: z.string().min(1),
        type: z.string().optional(),
        ext: z.string().optional(),
        limit: z.string().transform(Number).optional(),
      });
      
      const { q, type, ext } = schema.parse(req.query);
      
      const files = await storage.searchFiles(q, req.user!.id, { type, ext });
      res.json(files);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Trash routes
  app.get("/api/trash", requireAuth, async (req, res) => {
    try {
      const trashItems = await storage.getTrashItems(req.user!.id);
      res.json(trashItems);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/trash/restore", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        ids: z.array(z.string()),
        type: z.enum(["file", "folder"]),
      });
      
      const { ids, type } = schema.parse(req.body);
      
      for (const id of ids) {
        await storage.restoreFromTrash(id, type);
        
        await storage.createAuditLog({
          userId: req.user!.id,
          action: `${type}_restored`,
          targetType: type,
          targetId: id,
          meta: {},
        });
      }

      res.sendStatus(200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/trash/purge", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        ids: z.array(z.string()),
        type: z.enum(["file", "folder"]),
      });
      
      const { ids, type } = schema.parse(req.body);
      
      for (const id of ids) {
        if (type === "file") {
          await fileService.permanentlyDeleteFile(id, req.user!.id);
        } else {
          await storage.permanentlyDelete(id, "folder");
        }
      }

      res.sendStatus(200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Share links
  app.post("/api/shares", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        resourceType: z.enum(["file", "folder"]),
        resourceId: z.string(),
        expiresAt: z.string().datetime().optional(),
        password: z.string().optional(),
        allowDownload: z.boolean().default(true),
      });
      
      const data = schema.parse(req.body);
      
      // Hash password if provided
      let passwordHash: string | undefined;
      if (data.password) {
        const crypto = await import("crypto");
        passwordHash = crypto.createHash("sha256").update(data.password).digest("hex");
      }

      const shareLink = await storage.createShareLink({
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        passwordHash,
        allowDownload: data.allowDownload,
        createdBy: req.user!.id,
      });

      await storage.createAuditLog({
        userId: req.user!.id,
        action: "share_link_created",
        targetType: data.resourceType,
        targetId: data.resourceId,
        meta: { shareId: shareLink.id },
      });

      res.json({
        id: shareLink.id,
        url: `${process.env.SHARE_BASE_URL || "http://localhost:5000"}/s/${shareLink.id}`,
        expiresAt: shareLink.expiresAt,
        allowDownload: shareLink.allowDownload,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Batch download
  app.post("/api/download/batch", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        fileIds: z.array(z.string()),
      });
      
      const { fileIds } = schema.parse(req.body);
      
      // Verify all files belong to user
      const files = await Promise.all(
        fileIds.map(id => storage.getFileById(id))
      );
      
      const validFiles = files.filter(file => 
        file && file.ownerId === req.user!.id
      );

      if (validFiles.length === 0) {
        return res.status(404).json({ message: "No valid files found" });
      }

      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="files-${Date.now()}.zip"`);

      const archive = archiver("zip", { zlib: { level: 9 } });
      archive.pipe(res);

      for (const file of validFiles) {
        try {
          const fileBuffer = await storageService.getFile(file!.storageKey);
          archive.append(fileBuffer, { name: `${file!.name}.${file!.ext}` });
        } catch (error) {
          console.error(`Failed to add file ${file!.id} to archive:`, error);
        }
      }

      await archive.finalize();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User stats
  app.get("/api/me/usage", requireAuth, async (req, res) => {
    try {
      const files = await storage.getFilesByFolder(null, req.user!.id);
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      const totalFiles = files.length;
      
      res.json({
        totalSize,
        totalFiles,
        quota: 5 * 1024 * 1024 * 1024, // 5GB default
        percentage: Math.round((totalSize / (5 * 1024 * 1024 * 1024)) * 100),
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
