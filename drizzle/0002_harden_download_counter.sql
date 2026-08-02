ALTER TABLE `downloads` ADD `window_started_at` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `downloads` ADD `window_count` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
CREATE TABLE `hivebuzz_meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
DELETE FROM `downloads`
WHERE `release_key` IN (
	SELECT `release_key` FROM `releases` WHERE `type` <> 'agent'
);
--> statement-breakpoint
DELETE FROM `releases` WHERE `type` <> 'agent';
--> statement-breakpoint
DROP TABLE IF EXISTS `honeys`;
--> statement-breakpoint
DROP TABLE IF EXISTS `packs`;
--> statement-breakpoint
PRAGMA optimize;
