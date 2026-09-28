CREATE TABLE `document_uploads` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`workspace_id` text,
	`name` text NOT NULL,
	`content_type` text NOT NULL,
	`size` text NOT NULL,
	`object_key` text NOT NULL,
	`extracted_text` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `document_uploads_user_created_idx` ON `document_uploads` (`user_id`,`created_at`);