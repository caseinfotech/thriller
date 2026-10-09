CREATE TABLE `attendance` (
	`session_id` text NOT NULL,
	`participant_email` text NOT NULL,
	`signup_id` text NOT NULL,
	`checked_in_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`session_id`, `signup_id`)
);
--> statement-breakpoint
ALTER TABLE `signups` ADD `source` text DEFAULT 'existing' NOT NULL;
--> statement-breakpoint
INSERT OR IGNORE INTO attendance(session_id,participant_email,signup_id,checked_in_at) SELECT 'thriller-2026-week-1',LOWER(TRIM(MIN(email))),MIN(id),'2026-10-08 21:00:00' FROM signups GROUP BY LOWER(TRIM(name));
