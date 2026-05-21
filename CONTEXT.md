# pongolinks

pongolinks is a personal bookmark library for saving, organizing, and rediscovering links.

## Language

**Bookmark**:
A saved primary link with title, description, visibility, timestamps, and optional organization metadata.
_Avoid_: link, favorite, item

**Bookmark URL**:
The primary HTTP(S) URL that identifies a Bookmark.
Bookmark URL lookup treats a trailing slash at the end of the URL path as equivalent, while keeping protocol, host, path text, query, and hash strict unless an explicit lookup rule says otherwise.
_Avoid_: link URL, saved URL, item URL

**Tag**:
A reusable label attached to bookmarks for organization and filtering.
A Tag name is a single whitespace-free token; spaces separate multiple Tags in text entry.
Changing a Tag name keeps the same Tag identity when its normalized name is unchanged.
_Avoid_: category, folder, label

**Tag Popularity**:
The number of current Bookmarks a Tag is attached to.
_Avoid_: weight, rank, score

**Bookmark Filter**:
A strict condition that includes or excludes Bookmarks from a Bookmark list.
A Bookmark Filter can include Tags, exclude Tags, match Bookmark URL host text, and combine with a Bookmark Search Query.
A Bookmark Filter cannot be combined with Bookmark URL lookup mode.
Including and excluding the same Tag in one Bookmark Filter is invalid.
Pagination is not part of a Bookmark Filter; changing a Bookmark Filter resets list pagination as route workflow behavior.
_Avoid_: search term, query term

**Bookmark Search Query**:
Free-form text used to rediscover Bookmarks by matching their searchable content.
_Avoid_: filter, tag filter

**Related Link**:
A secondary explicit HTTP(S) URL automatically extracted from a Bookmark description because it provides nearby or supporting context.
_Avoid_: child bookmark, attachment, reference

**Private Bookmark**:
A bookmark intentionally hidden from public-facing views or exports.
_Avoid_: secret link, hidden item

**Bookmarklet**:
A browser bookmark tool that starts saving the current page as a Bookmark.
_Avoid_: extension, browser plugin, capture link

## Relationships

- A **Bookmark** can have zero or more **Tags**
- A **Tag** can belong to zero or more **Bookmarks**
- **Tag Popularity** is counted from a **Tag**'s current Bookmark attachments
- A **Bookmark Filter** can include or exclude Bookmarks by their organization metadata or Bookmark URL host
- A **Bookmark Search Query** can match a Bookmark's searchable content without requiring exact organization metadata
- A **Bookmark** can have zero or more **Related Links**
- A **Related Link** belongs to exactly one **Bookmark**
- A **Private Bookmark** is a specialization of **Bookmark**
- A **Bookmarklet** can start creating one **Bookmark**
- A **Bookmark URL** can identify at most one **Bookmark**

## Rules

- **Related Links** are synchronized from explicit HTTP(S) URLs in the Bookmark description by adding newly extracted URLs and removing URLs that are no longer present.
- **Tags** attached to a Bookmark are synchronized from submitted Tag text by attaching newly submitted Tags and detaching Tags that are no longer submitted.
- A **Tag** with no attached Bookmarks is removed.
- Changing a **Tag** name to a different normalized name replaces the original Tag by transferring Bookmark attachments to the replacement Tag and removing the original Tag.

## Example dialogue

> **Dev:** "If I save a blog post and add the author's GitHub profile, is that second URL another **Bookmark**?"
> **Domain expert:** "No. The blog post is the **Bookmark**. The GitHub profile is a **Related Link** unless you want to manage it independently."

## Flagged ambiguities

- "client" can mean the SPA or a future browser extension; resolved: use **frontend** for the Vue SPA and reserve extension-specific naming for the future browser extension.
