# Extension URL check cache invalidation through page messages

pongolinks will keep the Chrome extension's `urlCheckCache` in sync with bookmark mutations by sending an explicit page message from the frontend after a bookmark is created, updated, or deleted. A content script on the app origin relays that message to the extension service worker, which deletes the affected cache entries and rechecks any open tabs that still match those URLs.
