CREATE TABLE `prompt_history` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`situation` text NOT NULL,
	`title` text NOT NULL,
	`prompt` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `prompt_history_user_created_idx` ON `prompt_history` (`user_id`,`created_at`);