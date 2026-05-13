# Value Objects for validated domain primitives

pongolinks will use Value Objects for domain primitives whose validity matters before they reach backend application and persistence logic. For example, `BookmarkUrl` represents a trimmed, absolute `http://` or `https://` URL, and `BookmarkId` represents a positive safe integer identifier. This adds a small amount of ceremony compared with passing raw `string` and `number` values, but it keeps domain invariants explicit, testable, and hard to bypass as vertical slices grow.
