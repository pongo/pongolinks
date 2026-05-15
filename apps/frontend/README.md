# Frontend

## Responsibility

The frontend is the Vue SPA for pongolinks. It owns browser UI, route-level views, feature components, and calls to the
backend API through the Eden client contract.

## Boundaries

Keep user-facing behavior in vertical feature slices under `src/features/<feature>/`. Shared visual or routing glue may
live outside feature folders only when it is genuinely cross-feature.

Do not duplicate backend validation or database rules here. Do not introduce user-facing copy in languages other than
English.

## Entry Points

- `src/main.ts` creates the Vue app and installs the router.
- `src/router.ts` owns SPA route registration.
- `src/features/*` contains feature-owned views, API adapters, and UI components.

## Testing

Use the root commands unless you are intentionally narrowing scope:

- `bun run typecheck`
- `bun run agent:test`

Frontend-specific tests should live near the feature they verify or under an app-level test directory if the behavior
crosses features.

## Conventions

Use the backend Eden contract for API calls instead of hand-written endpoint shapes. Keep route registration thin; put
feature-specific UI and data loading in the feature directory.

UI text must be in English. Use the domain terms from `CONTEXT.md` in labels, views, tests, and issue titles.
