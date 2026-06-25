# Extension URL check cache invalidation through page messages

pongolinks will keep the Chrome extension's `urlCheckCache` in sync with bookmark mutations by sending an explicit page message from the frontend after a bookmark is created, updated, or deleted. A content script on the app origin relays that message to the extension service worker, which deletes the affected cache entries and rechecks only active tabs that still match those URLs.

This keeps cache invalidation local to the extension, avoids coupling the frontend to extension internals, and preserves the existing browser-tab badge behavior after mutations. The alternative of rebuilding cache state from backend responses alone was rejected because the extension owns the cache and needs to react immediately to mutations that happen outside the extension UI.
