# Browser extension

The Chrome and Firefox extensions recognize saved bookmarks in open browser tabs and open the bookmark creation flow for the current page. They use the configured pongolinks origin, its HTTP API, and the browser profile's existing pongolinks session cookie. They do not own backend or database behavior.

## URL-check cache invalidation

Each extension keeps an in-memory `urlCheckCache` in its background process to avoid repeatedly checking the same tab URL. A bookmark mutation in the frontend can make cached results stale, so the frontend notifies an installed extension after a bookmark is created, updated, or deleted.

The frontend includes the bookmark URL and every related-link URL from both the previous and current bookmark state when applicable. This covers URLs that were removed or added during an edit as well as the bookmark's primary URL.

### Page-message contract

The frontend sends this same-origin window message:

```ts
{
  type: "pongolinks.invalidate-url-check-cache";
  requestId: string;
  urls: string[];
}
```

The extension content script only accepts the message when `event.source` is `window` and `event.origin` is the current pongolinks origin. It relays the payload to the extension background process, then posts this same-origin acknowledgement:

```ts
{
  type: "url-check-cache-invalidation-ack";
  requestId: string;
}
```

The frontend waits for the matching acknowledgement for at most three seconds. Expiry is successful no-op behavior: the application remains correct when no extension is installed, no content script is available, or delivery does not complete.

### Background-process behavior

On receiving a valid invalidation message, the background process removes every supplied URL from `urlCheckCache`. It then rechecks every open tab whose URL exactly matches one of those URLs, updating the tab badge from the current backend result. Empty URL lists do nothing.

Keep the message type, acknowledgement type, payload fields, origin checks, and exact-URL matching behavior compatible across the frontend and both extensions. Update this document and all three protocol boundaries together when changing the contract.
