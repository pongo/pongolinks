# Regression-Test Tag Autocomplete Slice

Status: ready-for-agent
Labels: ready-for-agent

## Goal

Verify that the new read-only Tags slice and Bookmark form autocomplete do not regress existing Bookmark Tag behavior.

## Scope

- Confirm existing Bookmark create/edit Tag submit behavior is unchanged.
- Confirm `tagsText` still submits as plain text.
- Confirm backend Tag attachment, diff synchronization, and orphan cleanup still pass existing tests.
- Confirm `GET /pongolinks/api/tags` coexists with Bookmark routes under `/pongolinks/api`.
- Review UI text for English-only copy.
- Keep code comments in English.

## Verification

Run:

```bash
bun run typecheck
bun run agent:test
bun run format
```

Do not run a dev server.

## Out Of Scope

- Starting the dev server.
- Deploy.
- Git commit.

