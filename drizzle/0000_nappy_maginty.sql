CREATE TABLE `businesses` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`business_type` text DEFAULT 'other' NOT NULL,
	`locale` text DEFAULT 'en' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `customer_interests` (
	`customer_id` text NOT NULL,
	`interest_id` text NOT NULL,
	`business_id` text NOT NULL,
	PRIMARY KEY(`customer_id`, `interest_id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`city` text,
	`notes` text,
	`created_by` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`last_seen_at` text NOT NULL,
	`deleted_at` text,
	`search_blob` text DEFAULT '' NOT NULL,
	`dirty` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customers_biz_phone_uq` ON `customers` (`business_id`,`phone`) WHERE "customers"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX `customers_biz_seen_idx` ON `customers` (`business_id`,`last_seen_at`);--> statement-breakpoint
CREATE INDEX `customers_dirty_idx` ON `customers` (`dirty`);--> statement-breakpoint
CREATE TABLE `id_merges` (
	`losing_id` text PRIMARY KEY NOT NULL,
	`winning_id` text NOT NULL,
	`entity` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `interests` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`label` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`archived` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`dirty` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `interests_biz_idx` ON `interests` (`business_id`,`archived`,`sort_order`);--> statement-breakpoint
CREATE TABLE `locations` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`label` text NOT NULL,
	`archived` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`dirty` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `locations_biz_idx` ON `locations` (`business_id`,`archived`);--> statement-breakpoint
CREATE TABLE `outbox` (
	`id` text PRIMARY KEY NOT NULL,
	`entity` text NOT NULL,
	`entity_id` text NOT NULL,
	`op` text NOT NULL,
	`payload` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`next_attempt_at` text NOT NULL,
	`last_error` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `outbox_ready_idx` ON `outbox` (`next_attempt_at`,`created_at`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`name` text NOT NULL,
	`phone_e164` text,
	`role` text DEFAULT 'staff' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sync_meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `visit_interests` (
	`visit_id` text NOT NULL,
	`interest_id` text NOT NULL,
	`business_id` text NOT NULL,
	PRIMARY KEY(`visit_id`, `interest_id`)
);
--> statement-breakpoint
CREATE TABLE `visits` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`location_id` text,
	`location_label` text DEFAULT '' NOT NULL,
	`note` text,
	`visited_at` text NOT NULL,
	`created_by` text,
	`created_at` text NOT NULL,
	`dirty` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `visits_customer_idx` ON `visits` (`customer_id`,`visited_at`);--> statement-breakpoint
CREATE INDEX `visits_biz_time_idx` ON `visits` (`business_id`,`visited_at`);--> statement-breakpoint
CREATE INDEX `visits_dirty_idx` ON `visits` (`dirty`);