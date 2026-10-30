CREATE TABLE `future_event_contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`consented_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `future_event_contacts_email_unique` ON `future_event_contacts` (`email`);--> statement-breakpoint
CREATE INDEX `future_event_contacts_created_idx` ON `future_event_contacts` ("created_at" desc);--> statement-breakpoint
CREATE TABLE `future_event_signup_rate_limits` (
	`day` text NOT NULL,
	`fingerprint` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`day`, `fingerprint`)
);
