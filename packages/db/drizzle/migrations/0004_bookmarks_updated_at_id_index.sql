DROP INDEX `idx_bookmarks_updated_at`;--> statement-breakpoint
CREATE INDEX `idx_bookmarks_updated_at_id` ON `bookmarks` ("updated_at" desc,"id" desc);
