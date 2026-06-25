# Extension URL check cache invalidation through page messages

pongolinks will notify the Chrome extension about bookmark mutations with an explicit page message from the frontend after a bookmark is created, updated, or deleted. A content script on the app origin relays that message to the extension service worker, which owns `urlCheckCache`, deletes the affected entries, clears badges on matching tabs, and rechecks only active tabs that still match those URLs.

This keeps invalidation logic inside the extension, avoids coupling the frontend to extension internals, and preserves the existing tab badge behavior after mutations.
