CREATE TABLE `auth_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`token_hash` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`expires_at` text NOT NULL,
	CONSTRAINT "auth_sessions_token_hash_not_empty" CHECK("auth_sessions"."token_hash" <> ''),
	CONSTRAINT "auth_sessions_expires_at_not_empty" CHECK("auth_sessions"."expires_at" <> '')
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_sessions_token_hash_unique` ON `auth_sessions` (`token_hash`);--> statement-breakpoint
CREATE INDEX `idx_auth_sessions_expires_at` ON `auth_sessions` (`expires_at`);
