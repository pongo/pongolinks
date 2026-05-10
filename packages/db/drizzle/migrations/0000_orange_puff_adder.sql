CREATE TABLE `bookmark_tags` (
	`bookmark_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	PRIMARY KEY(`bookmark_id`, `tag_id`),
	FOREIGN KEY (`bookmark_id`) REFERENCES `bookmarks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_bookmark_tags_tag_id` ON `bookmark_tags` (`tag_id`);--> statement-breakpoint
CREATE TABLE `bookmarks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`url` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`is_private` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "bookmarks_url_not_empty" CHECK("bookmarks"."url" <> ''),
	CONSTRAINT "bookmarks_title_not_empty" CHECK("bookmarks"."title" <> ''),
	CONSTRAINT "bookmarks_is_private_boolean" CHECK("bookmarks"."is_private" IN (0, 1))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bookmarks_url_unique` ON `bookmarks` (`url`);--> statement-breakpoint
CREATE INDEX `idx_bookmarks_updated_at` ON `bookmarks` ("updated_at" desc);--> statement-breakpoint
CREATE TABLE `related_links` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`bookmark_id` integer NOT NULL,
	`url` text NOT NULL,
	FOREIGN KEY (`bookmark_id`) REFERENCES `bookmarks`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "related_links_url_not_empty" CHECK("related_links"."url" <> '')
);
--> statement-breakpoint
CREATE INDEX `idx_related_links_bookmark_id` ON `related_links` (`bookmark_id`);--> statement-breakpoint
CREATE INDEX `idx_related_links_url` ON `related_links` (`url`);--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`name_lower` text NOT NULL,
	CONSTRAINT "tags_name_not_empty" CHECK("tags"."name" <> ''),
	CONSTRAINT "tags_name_lower_not_empty" CHECK("tags"."name_lower" <> '')
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_lower_unique` ON `tags` (`name_lower`);