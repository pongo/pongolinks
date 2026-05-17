# Frontend

See `/docs/architecture.md` for the project-wide architecture rules, import boundaries, error handling policy, and verification commands.

## Responsibility

The frontend is the Vue SPA for pongolinks. It owns browser UI, route-level views, feature components, and calls to the
backend API through the Eden client contract.

## Boundaries

Keep user-facing behavior in vertical feature slices under `src/features/<feature>/`. Shared visual or routing glue may
live outside feature folders only when it is genuinely cross-feature.

Do not duplicate backend validation or database rules here. Do not introduce user-facing copy in languages other than
English.

Use the backend Eden contract for API calls instead of hand-written endpoint shapes.
