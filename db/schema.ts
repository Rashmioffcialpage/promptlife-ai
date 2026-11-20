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

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  passwordHash: text("password_hash"),
  googleSubject: text("google_subject").unique(),
  role: text("role").notNull(),
  roles: text("roles").notNull(),
  profiles: text("profiles").notNull().default("{}"),
  profileComplete: integer("profile_complete", { mode: "boolean" }).notNull().default(false),
  acceptedAt: text("accepted_at").notNull(),
});

export const accountSessions = sqliteTable("account_sessions", {
  tokenHash: text("token_hash").primaryKey(),
  accountId: text("account_id").notNull().references(() => accounts.id),
  expires: integer("expires").notNull(),
}, table => [index("account_sessions_expiry").on(table.expires)]);

export const authAttempts = sqliteTable("auth_attempts", {
  key: text("key").primaryKey(),
  window: integer("window").notNull(),
  count: integer("count").notNull(),
});
