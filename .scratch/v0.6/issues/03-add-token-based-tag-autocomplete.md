# Add Token-Based Tag Autocomplete

Status: ready-for-agent
Labels: ready-for-agent

## Goal

Add autocomplete behavior to the existing plain text `Tags` input in `BookmarkForm.vue`.

## Scope

- Keep the `Tags` field as a single plain text input.
- Compute the current token from input value and cursor position.
- Show suggestions only when the current token is non-empty.
- Filter loaded Tags by `tag.nameLower.includes(currentTokenLower)`.
- Show `tag.name`, not `tag.nameLower`.
- Preserve backend popularity order while filtering locally.
- Limit visible suggestions to 7.
- Exclude exact `nameLower` matches.
- Exclude Tags already entered in other tokens of the same input by `nameLower`.
- Render a quiet suggestion list below the input.
- Add active-row styling for keyboard navigation.
- Select by `mousedown.prevent`.
- Select by `Tab` or `Enter`.
- If the list is open and no suggestion is active, `Enter` selects the first suggestion instead of submitting the form.
- `ArrowDown` opens/focuses suggestions when the current token is non-empty and suggestions exist.
- `ArrowUp` and `ArrowDown` move the active suggestion while open.
- `Escape` closes without selection.
- `Space` closes without selection and still inserts the space into the input.
- On selection, replace only the current token, add exactly one trailing space, preserve following text, and place the cursor after the trailing space.
- Add lightweight ARIA combobox/listbox attributes.

## Out Of Scope

- Fuzzy search.
- Highlighting matched substrings.
- Tag icons, colors, or metadata.
- External combobox/autocomplete dependency.
- Changing backend Tag parsing or deduplication rules.

## Tests

If the autocomplete logic is extracted to a helper, add tests for:

- Substring matching against `nameLower`.
- Preserving backend order while limiting to 7.
- Excluding exact matches.
- Excluding Tags already entered in other tokens.
- Replacing the current token and adding exactly one trailing space.
- Preserving following tokens without double-spacing.

If the behavior stays entirely inside `BookmarkForm.vue`, do not add a Vue component testing stack only for this issue.

