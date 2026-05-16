export type BookmarkUrlCheckBookmark = {
  id: number;
  url: string;
  title: string;
};

export type BookmarkUrlCheckResult =
  | { status: "exact-bookmark"; bookmark: BookmarkUrlCheckBookmark }
  | { status: "alternate-protocol-bookmark"; bookmark: BookmarkUrlCheckBookmark }
  | { status: "related-link"; bookmarks: BookmarkUrlCheckBookmark[] }
  | { status: "not-found" };
