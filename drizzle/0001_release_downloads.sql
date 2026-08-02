CREATE TABLE `releases` (
	`release_key` text PRIMARY KEY NOT NULL,
	`release_id` text NOT NULL,
	`type` text NOT NULL CHECK (`type` IN ('agent', 'pack')),
	`name` text NOT NULL,
	`version` text NOT NULL,
	`summary` text NOT NULL,
	`artifact_url` text NOT NULL,
	`artifact_sha256` text NOT NULL,
	`artifact_size` integer NOT NULL,
	`manifest_json` text NOT NULL,
	`risk_level` text NOT NULL CHECK (`risk_level` IN ('low', 'review', 'elevated')),
	`created_at` integer NOT NULL,
	CONSTRAINT `releases_release_id_version_unique` UNIQUE(`release_id`,`version`)
);
--> statement-breakpoint
CREATE INDEX `idx_releases_type_created` ON `releases` (`type`,`created_at`);--> statement-breakpoint
CREATE TABLE `downloads` (
	`release_key` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 0 NOT NULL CHECK (`count` >= 0),
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`release_key`) REFERENCES `releases`(`release_key`) ON UPDATE no action ON DELETE no action
);
