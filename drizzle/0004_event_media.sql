CREATE TABLE `event_media` (
	`id` text PRIMARY KEY NOT NULL,
	`submitter_key` text NOT NULL,
	`object_key` text NOT NULL,
	`content_type` text NOT NULL,
	`original_name` text NOT NULL,
	`file_size` integer NOT NULL,
	`part_count` integer NOT NULL,
	`contributor` text DEFAULT '' NOT NULL,
	`caption` text DEFAULT '' NOT NULL,
	`credit_contributor` integer DEFAULT 0 NOT NULL,
	`consented_at` text NOT NULL,
	`status` text DEFAULT 'uploading' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`published_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `event_media_object_key_unique` ON `event_media` (`object_key`);--> statement-breakpoint
CREATE INDEX `event_media_status_created_idx` ON `event_media` (`status`,"created_at" desc);--> statement-breakpoint
CREATE INDEX `event_media_submitter_idx` ON `event_media` (`submitter_key`);--> statement-breakpoint
CREATE TABLE `event_media_rate_limits` (
	`day` text NOT NULL,
	`fingerprint` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`day`, `fingerprint`)
);
--> statement-breakpoint
CREATE TABLE `event_media_submission_limits` (
	`submitter_key` text PRIMARY KEY NOT NULL,
	`used` integer DEFAULT 0 NOT NULL
);
