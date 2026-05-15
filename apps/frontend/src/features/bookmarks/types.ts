export type TagDTO = {
  id: number;
  name: string;
  nameLower: string;
};

export type RelatedLinkDTO = {
  id: number;
  url: string;
};

export type BookmarkDTO = {
  id: number;
  url: string;
  title: string;
  description: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  tags: TagDTO[];
  relatedLinks: RelatedLinkDTO[];
};

export type BookmarkListPagination = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type BookmarkListResponse = {
  bookmarks: BookmarkDTO[];
  pagination: BookmarkListPagination;
};

export type DeletedBookmarkResponse = {
  deletedBookmarkId: number;
};

export type EditableBookmarkPayload = {
  url: string;
  title: string;
  description: string;
  isPrivate: boolean;
  tagsText: string;
};
