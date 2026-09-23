CREATE TABLE `notification_reads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`notification_id` integer NOT NULL,
	`player_id` integer NOT NULL,
	`read_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`notification_id`) REFERENCES `notifications`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notification_reads_notification_player_idx` ON `notification_reads` (`notification_id`,`player_id`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`body` text NOT NULL,
	`sent_at` integer DEFAULT (unixepoch()) NOT NULL,
	`sent_by` integer NOT NULL,
	FOREIGN KEY (`sent_by`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade
);
