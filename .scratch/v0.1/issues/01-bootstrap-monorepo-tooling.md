# Bootstrap monorepo tooling

Status: ready-for-agent

## Parent

.scratch/v0.1/IMPLEMENTATION_PLAN.md

## What to build

Create the minimal Bun workspace skeleton that future v0.1 slices can build on. The repository should have root scripts, Turborepo orchestration, shared TypeScript defaults, workspace package names under `@pongolinks/*`, formatting through `oxfmt`, and the empty app/package directories required by the v0.1 plan.

## Acceptance criteria

- [ ] Root `package.json` defines Bun workspaces for `apps/*` and `packages/*`.
- [ ] Root scripts include `dev`, `build`, `typecheck`, `test`, `format`, and `db:migrate`.
- [ ] `turbo.json` defines minimal `dev`, `build`, `typecheck`, `test`, and `format` tasks.
- [ ] Root `tsconfig.base.json` exists and each workspace has a local `tsconfig.json` extending it.
- [ ] Workspaces exist for `@pongolinks/backend`, `@pongolinks/frontend`, `@pongolinks/db`, and `@pongolinks/shared`.
- [ ] `.data/` is ignored by git.
- [ ] `packages/shared` has an empty public entrypoint and does not export domain or API types.
- [ ] `bun run format`, `bun run typecheck`, `bun run test`, and `bun run build` are wired without fake lint commands.

## Blocked by

None - can start immediately
