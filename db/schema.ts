import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const promptHistory = sqliteTable(
  "prompt_history",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    situation: text("situation").notNull(),
    title: text("title").notNull(),
    prompt: text("prompt").notNull(),
    workspaceId: text("workspace_id"),
    inputScore: integer("input_score"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("prompt_history_user_created_idx").on(table.userId, table.createdAt)],
);

export const courseWorkspaces = sqliteTable(
  "course_workspaces",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    type: text("type").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("course_workspaces_user_created_idx").on(table.userId, table.createdAt)],
);

export const documentUploads = sqliteTable(
  "document_uploads",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    workspaceId: text("workspace_id"),
    name: text("name").notNull(),
    contentType: text("content_type").notNull(),
    size: text("size").notNull(),
    objectKey: text("object_key").notNull(),
    extractedText: text("extracted_text"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("document_uploads_user_created_idx").on(table.userId, table.createdAt)],
);

export type PromptHistoryItem = typeof promptHistory.$inferSelect;
export type CourseWorkspace = typeof courseWorkspaces.$inferSelect;
export type DocumentUpload = typeof documentUploads.$inferSelect;
