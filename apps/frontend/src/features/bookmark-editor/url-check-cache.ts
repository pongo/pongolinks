import type { BookmarkDTO } from "#/features/bookmarks/types.ts";

export type BookmarkUrlSource = Pick<BookmarkDTO, "url" | "relatedLinks">;

const URL_CHECK_CACHE_INVALIDATION_MESSAGE_TYPE = "pongolinks.invalidate-url-check-cache";

export function collectBookmarkUrls(...bookmarks: BookmarkUrlSource[]) {
  const urls = new Set<string>();

  for (const bookmark of bookmarks) {
    urls.add(bookmark.url);

    for (const relatedLink of bookmark.relatedLinks) {
      urls.add(relatedLink.url);
    }
  }

  return [...urls];
}

interface PostMessageWithAckOptions<T> {
  message: T;
  ackType: string;
  origin?: string;
  timeoutMs?: number;
}

export function postMessageWithAck<T extends { requestId: string }>({
  message,
  ackType,
  origin = window.location.origin,
  timeoutMs = 3000,
}: PostMessageWithAckOptions<T>): Promise<void> {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      window.removeEventListener("message", onMessage);
      resolve();
    }, timeoutMs);

    function onMessage(event: MessageEvent) {
      if (
        event.source !== window ||
        event.origin !== origin ||
        event.data?.type !== ackType ||
        event.data?.requestId !== message.requestId
      ) {
        return;
      }
      clearTimeout(timeoutId);
      window.removeEventListener("message", onMessage);
      resolve();
    }

    window.addEventListener("message", onMessage);
    window.postMessage(message, origin);
  });
}

const URL_CHECK_CACHE_INVALIDATION_ACK_TYPE = "url-check-cache-invalidation-ack";

export function invalidateBookmarkUrlCheckCache(...bookmarks: BookmarkUrlSource[]): Promise<void> {
  const urls = collectBookmarkUrls(...bookmarks);
  if (urls.length === 0) {
    return Promise.resolve();
  }

  return postMessageWithAck({
    message: {
      type: URL_CHECK_CACHE_INVALIDATION_MESSAGE_TYPE,
      requestId: crypto.randomUUID(),
      urls,
    },
    ackType: URL_CHECK_CACHE_INVALIDATION_ACK_TYPE,
  });
}
