# Centralize frontend color tokens

Status: ready-for-agent
Labels: ready-for-agent

## Goal

Move the currently used frontend color values into one token-backed place without changing the visual design.

## Scope

- Add CSS custom properties in `apps/frontend/src/style.css` for the currently used palette.
- Add semantic CSS classes or Tailwind CSS 4 utilities for repeated UI roles:
  - page text;
  - muted text;
  - primary action;
  - danger message;
  - input border and focus states;
  - subtle borders;
  - white surfaces.
- Replace literal CSS colors such as hex values in current frontend styles with token-backed values.
- Replace currently used Tailwind color classes in existing frontend views/components with semantic classes/utilities backed by the tokens.
- Keep the visual output intentionally equivalent to the current UI.

## Out Of Scope

- Changing spacing, typography scale, layout, or interaction behavior.
- Adding Button, Input, Card, or form-control abstractions.
- Adding a full component library or broad design system.
- Dark mode, runtime theme switching, or user-selectable themes.
- Reworking unrelated frontend structure beyond imports needed for this issue.

## Tests

- Run existing frontend tests through `bun run agent:test`.
- Run `bun run typecheck`.
- Run `bun run format`.

Manual visual review may be useful, but do not start a dev server as part of agent verification.
