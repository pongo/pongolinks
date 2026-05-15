import type { BookmarkDTO } from "./domain/contracts.ts";

export const BOOKMARK_LIST_PAGE_SIZE = 3;

export type BookmarkListPagination = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type PaginatedBookmarkList = {
  bookmarks: BookmarkDTO[];
  pagination: BookmarkListPagination;
};

export function normalizeBookmarkListPage(value: unknown): number {
  const parsed = typeof value === "string" && value.trim() !== "" ? Number(value) : Number.NaN;

  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function bookmarkListOffset(page: number): number {
  return (page - 1) * BOOKMARK_LIST_PAGE_SIZE;
}

export function createBookmarkListPagination({
  page,
  totalCount,
}: {
  page: number;
  totalCount: number;
}): BookmarkListPagination {
  const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / BOOKMARK_LIST_PAGE_SIZE);

  return {
    page: totalCount === 0 ? 1 : page,
    pageSize: BOOKMARK_LIST_PAGE_SIZE,
    totalCount,
    totalPages,
    hasPreviousPage: totalPages > 0 && page > 1,
    hasNextPage: page < totalPages,
  };
}
