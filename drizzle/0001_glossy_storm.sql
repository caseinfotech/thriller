CREATE TABLE `notice_pin_attempts` (
	`bucket` text PRIMARY KEY NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL
);
