CREATE TABLE `registration_reconciliations` (
	`id` text PRIMARY KEY NOT NULL,
	`snapshot` text NOT NULL,
	`plan` text NOT NULL,
	`signups_before` text NOT NULL,
	`attendance_before` text NOT NULL,
	`consistent` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "registration_snapshot_matches" CHECK("registration_reconciliations"."consistent" = 1)
);
