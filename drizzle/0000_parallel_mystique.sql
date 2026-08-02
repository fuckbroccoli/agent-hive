CREATE TABLE `honeys` (
	`event_id` text PRIMARY KEY NOT NULL,
	`pack_event_id` text NOT NULL,
	`giver_pubkey` text NOT NULL,
	`event_json` text NOT NULL,
	`evidence` text,
	`created_at` integer NOT NULL,
	`revoked_at` integer,
	`revocation_event_json` text,
	FOREIGN KEY (`pack_event_id`) REFERENCES `packs`(`event_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_honeys_pack_active` ON `honeys` (`pack_event_id`,`revoked_at`);--> statement-breakpoint
CREATE INDEX `idx_honeys_giver_active` ON `honeys` (`giver_pubkey`,`revoked_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_honeys_active_signer` ON `honeys` (`pack_event_id`,`giver_pubkey`) WHERE `revoked_at` IS NULL;--> statement-breakpoint
CREATE TABLE `packs` (
	`event_id` text PRIMARY KEY NOT NULL,
	`publisher_pubkey` text NOT NULL,
	`pack_id` text NOT NULL,
	`name` text NOT NULL,
	`version` text NOT NULL,
	`summary` text NOT NULL,
	`artifact_url` text NOT NULL,
	`artifact_sha256` text NOT NULL,
	`artifact_size` integer NOT NULL,
	`manifest_json` text NOT NULL,
	`event_json` text NOT NULL,
	`risk_level` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`inserted_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_packs_publisher_pack_version` ON `packs` (`publisher_pubkey`,`pack_id`,`version`);--> statement-breakpoint
CREATE INDEX `idx_packs_status_created` ON `packs` (`status`,`created_at`);
