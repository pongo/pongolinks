Status: ready-for-agent

# Render Bookmark URL Wayback status

## Parent

.scratch/wayback-availability/PRD.md

## What to build

Add a separate frontend component for rendering Wayback availability status under the Bookmark URL field. The component should render checking, archived, not-archived, and error states using English UI text.

The Bookmark form may receive a Wayback status view model or a render surface for the component, but the status presentation should not be embedded inline inside the form template.

## Acceptance criteria

- [ ] Wayback status rendering lives in a separate component.
- [ ] The Bookmark form can show the status directly under the URL field.
- [ ] A checking state tells the user the Wayback status is being checked.
- [ ] An archived state tells the user the Bookmark URL is archived.
- [ ] The archived state links to the archived snapshot URL returned by the backend.
- [ ] The archived state displays the snapshot timestamp in a readable way.
- [ ] A not-archived state tells the user no Wayback snapshot was found.
- [ ] The not-archived state links to `https://web.archive.org/web/`.
- [ ] An error state shows a non-blocking failure message under the URL field.
- [ ] The status never disables or blocks the form submit action.
- [ ] Tests cover status rendering states if suitable component test prior art exists; otherwise cover the status view model or helper boundary.

## Blocked by

- .scratch/wayback-availability/issues/02-add-frontend-wayback-api-adapter.md

Commit message: `feat(bookmarks): render Wayback status for Bookmark URLs`
