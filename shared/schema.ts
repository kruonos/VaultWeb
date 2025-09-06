import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, json, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"), // nullable for OAuth users
  name: text("name").notNull(),
  role: text("role").notNull().default("user"), // 'admin' | 'user'
  googleId: text("google_id").unique(), // for Google OAuth
  provider: text("provider").notNull().default("local"), // 'local' | 'google'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const folders = pgTable("folders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  parentId: varchar("parent_id").references(() => folders.id, { onDelete: "cascade" }),
  ownerId: varchar("owner_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
}, (table) => ({
  ownerIdIdx: index("folders_owner_id_idx").on(table.ownerId),
  parentIdIdx: index("folders_parent_id_idx").on(table.parentId),
}));

export const files = pgTable("files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  ext: text("ext").notNull(),
  mime: text("mime").notNull(),
  size: integer("size").notNull(),
  storageKey: text("storage_key").notNull(),
  checksum: text("checksum"),
  ownerId: varchar("owner_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  folderId: varchar("folder_id").references(() => folders.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
}, (table) => ({
  ownerIdIdx: index("files_owner_id_idx").on(table.ownerId),
  folderIdIdx: index("files_folder_id_idx").on(table.folderId),
}));

export const shareLinks = pgTable("share_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resourceType: text("resource_type").notNull(), // 'file' | 'folder'
  resourceId: varchar("resource_id").notNull(),
  passwordHash: text("password_hash"),
  expiresAt: timestamp("expires_at"),
  allowDownload: boolean("allow_download").default(true).notNull(),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  resourceIdx: index("share_links_resource_idx").on(table.resourceType, table.resourceId),
}));

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(), // 'file' | 'folder'
  targetId: varchar("target_id").notNull(),
  meta: json("meta"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("audit_logs_user_id_idx").on(table.userId),
  createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  folders: many(folders),
  files: many(files),
  shareLinks: many(shareLinks),
  auditLogs: many(auditLogs),
}));

export const foldersRelations = relations(folders, ({ one, many }) => ({
  owner: one(users, { fields: [folders.ownerId], references: [users.id] }),
  parent: one(folders, { fields: [folders.parentId], references: [folders.id] }),
  children: many(folders),
  files: many(files),
}));

export const filesRelations = relations(files, ({ one }) => ({
  owner: one(users, { fields: [files.ownerId], references: [users.id] }),
  folder: one(folders, { fields: [files.folderId], references: [folders.id] }),
}));

export const shareLinksRelations = relations(shareLinks, ({ one }) => ({
  creator: one(users, { fields: [shareLinks.createdBy], references: [users.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  passwordHash: true,
  name: true,
  googleId: true,
  provider: true,
});

export const insertLocalUserSchema = insertUserSchema.omit({ googleId: true, provider: true });
export const insertGoogleUserSchema = insertUserSchema.omit({ passwordHash: true });

export const insertFolderSchema = createInsertSchema(folders).pick({
  name: true,
  parentId: true,
});

export const insertFileSchema = createInsertSchema(files).pick({
  name: true,
  ext: true,
  mime: true,
  size: true,
  storageKey: true,
  checksum: true,
  folderId: true,
});

export const insertShareLinkSchema = createInsertSchema(shareLinks).pick({
  resourceType: true,
  resourceId: true,
  passwordHash: true,
  expiresAt: true,
  allowDownload: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).pick({
  action: true,
  targetType: true,
  targetId: true,
  meta: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertFolder = z.infer<typeof insertFolderSchema>;
export type Folder = typeof folders.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;
export type InsertShareLink = z.infer<typeof insertShareLinkSchema>;
export type ShareLink = typeof shareLinks.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
