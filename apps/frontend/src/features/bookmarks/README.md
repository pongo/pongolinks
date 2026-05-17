# Bookmarks Frontend Feature

See `/docs/architecture.md` for project-wide vertical slice, import boundary, and frontend adapter rules.

## Responsibility

This directory owns frontend behavior around Bookmarks, including route-level screens, reusable Bookmark UI, Bookmark
API adapters, and Bookmark-specific helper logic.

## Boundaries

Keep durable schema and migration changes in `packages/db`. Keep backend HTTP route behavior in the backend Bookmark
feature. Keep Tag feature behavior in `features/tags`; Bookmark views may consume Tag summaries for the Bookmark editing
workflow.
