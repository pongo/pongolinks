# pongolinks

pongolinks is a personal bookmark library for saving, organizing, and rediscovering links.

## Language

**Bookmark**:
A saved primary link with title, description, visibility, timestamps, and optional organization metadata.
_Avoid_: link, favorite, item

**Tag**:
A reusable label attached to bookmarks for organization and filtering.
A Tag name is a single whitespace-free token; spaces separate multiple Tags in text entry.
_Avoid_: category, folder, label

**Related Link**:
A secondary URL attached to a bookmark because it provides nearby or supporting context.
_Avoid_: child bookmark, attachment, reference

**Private Bookmark**:
A bookmark intentionally hidden from public-facing views or exports.
_Avoid_: secret link, hidden item

## Relationships

- A **Bookmark** can have zero or more **Tags**
- A **Tag** can belong to zero or more **Bookmarks**
- A **Bookmark** can have zero or more **Related Links**
- A **Related Link** belongs to exactly one **Bookmark**
- A **Private Bookmark** is a specialization of **Bookmark**
- A URL can identify at most one **Bookmark**

## Example dialogue

> **Dev:** "If I save a blog post and add the author's GitHub profile, is that second URL another **Bookmark**?"
> **Domain expert:** "No. The blog post is the **Bookmark**. The GitHub profile is a **Related Link** unless you want to manage it independently."

## Flagged ambiguities

- "client" can mean the SPA or a future browser extension; resolved: use **frontend** for the Vue SPA and reserve extension-specific naming for the future browser extension.
