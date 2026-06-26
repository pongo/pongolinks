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

export function invalidateBookmarkUrlCheckCache(...bookmarks: BookmarkUrlSource[]) {
  const urls = collectBookmarkUrls(...bookmarks);
  if (urls.length === 0) {
    return;
  }

  window.postMessage(
    {
      type: URL_CHECK_CACHE_INVALIDATION_MESSAGE_TYPE,
      urls,
    },
    window.location.origin,
  );
}
