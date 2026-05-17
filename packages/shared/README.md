# Shared Package

See `/docs/architecture.md` for the project-wide architecture rules, workspace boundaries, and verification commands.

## Responsibility

`@pongolinks/shared` is reserved for stable TypeScript code that is truly shared by multiple workspaces and is not owned by a single app, package, or vertical feature slice.

## Boundaries

Prefer keeping types and helpers inside the feature that owns the behavior. Move code here only when at least two workspaces need the same stable contract and the shared abstraction does not create a dependency cycle.

Do not use this package as a dumping ground for convenience utilities, frontend-only UI types, backend-only route internals, or database schema definitions.

Exports should be boring, stable, and intentionally named.
