CREATE TABLE `participation` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`training_id` integer NOT NULL,
	`player_id` integer NOT NULL,
	`rsvp` text,
	`rsvp_at` integer,
	`present` integer,
	`checked_in_at` integer,
	`marked_by` text,
	FOREIGN KEY (`training_id`) REFERENCES `trainings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `participation_training_player_idx` ON `participation` (`training_id`,`player_id`);--> statement-breakpoint
CREATE TABLE `players` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`cap_number` integer,
	`role` text DEFAULT 'igrac' NOT NULL,
	`pin_hash` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `trainings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`starts_at` integer NOT NULL,
	`duration_min` integer DEFAULT 90 NOT NULL,
	`location` text DEFAULT 'Bazen Beograd' NOT NULL,
	`kind` text DEFAULT 'trening' NOT NULL,
	`checkin_opens_min` integer DEFAULT 60 NOT NULL,
	`checkin_closes_min` integer DEFAULT 30 NOT NULL,
	`canceled` integer DEFAULT false NOT NULL
);
