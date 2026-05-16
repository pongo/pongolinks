PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`name_lower` text NOT NULL,
	`usage_count` integer DEFAULT 0 NOT NULL,
	CONSTRAINT "tags_name_not_empty" CHECK("__new_tags"."name" <> ''),
	CONSTRAINT "tags_name_lower_not_empty" CHECK("__new_tags"."name_lower" <> ''),
	CONSTRAINT "tags_usage_count_non_negative" CHECK("__new_tags"."usage_count" >= 0)
);
--> statement-breakpoint
INSERT INTO `__new_tags`("id", "name", "name_lower", "usage_count") SELECT "id", "name", "name_lower", 0 FROM `tags`;--> statement-breakpoint
DROP TABLE `tags`;--> statement-breakpoint
ALTER TABLE `__new_tags` RENAME TO `tags`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_lower_unique` ON `tags` (`name_lower`);--> statement-breakpoint
UPDATE `tags`
SET `usage_count` = (
	SELECT COUNT(*)
	FROM `bookmark_tags`
	WHERE `bookmark_tags`.`tag_id` = `tags`.`id`
);--> statement-breakpoint
CREATE INDEX `idx_tags_usage_count_name` ON `tags` ("usage_count" desc,"name_lower" asc);--> statement-breakpoint
CREATE TRIGGER `tags_usage_count_ai`
AFTER INSERT ON `bookmark_tags`
BEGIN
	UPDATE `tags`
	SET `usage_count` = `usage_count` + 1
	WHERE `id` = NEW.`tag_id`;
END;--> statement-breakpoint
CREATE TRIGGER `tags_usage_count_ad`
AFTER DELETE ON `bookmark_tags`
BEGIN
	UPDATE `tags`
	SET `usage_count` = `usage_count` - 1
	WHERE `id` = OLD.`tag_id`;
END;--> statement-breakpoint
CREATE TRIGGER `tags_usage_count_au_tag_id`
AFTER UPDATE OF `tag_id` ON `bookmark_tags`
WHEN NEW.`tag_id` <> OLD.`tag_id`
BEGIN
	UPDATE `tags`
	SET `usage_count` = `usage_count` - 1
	WHERE `id` = OLD.`tag_id`;

	UPDATE `tags`
	SET `usage_count` = `usage_count` + 1
	WHERE `id` = NEW.`tag_id`;
END;
