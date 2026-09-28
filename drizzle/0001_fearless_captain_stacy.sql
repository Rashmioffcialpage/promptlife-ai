CREATE TABLE `course_workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `course_workspaces_user_created_idx` ON `course_workspaces` (`user_id`,`created_at`);--> statement-breakpoint
ALTER TABLE `prompt_history` ADD `workspace_id` text;