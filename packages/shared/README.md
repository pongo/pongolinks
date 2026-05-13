# Shared Package

## Responsibility

`@pongolinks/shared` is reserved for stable TypeScript code that is truly shared by multiple workspaces and is not owned by a single app, package, or vertical feature slice.

## Boundaries

Prefer keeping types and helpers inside the feature that owns the behavior. Move code here only when at least two workspaces need the same stable contract and the shared abstraction does not create a dependency cycle.

Do not use this package as a dumping ground for convenience utilities, frontend-only UI types, backend-only route internals, or database schema definitions.

## Entry Points

- `src/index.ts` is the public package export.

## Testing

Use the root commands unless you are intentionally narrowing scope:

- `bun run typecheck`
- `bun run agent:test`

Add package-local tests when this package starts exporting behavior.

## Conventions

Exports should be boring, stable, and intentionally named. If a type describes a domain concept, use the vocabulary from `CONTEXT.md`; if it describes a feature implementation detail, keep it in that feature instead.
