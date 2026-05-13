export type BookmarkDTO = {
  id: number;
  url: string;
  title: string;
  description: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
};

export type EditableBookmarkPayload = {
  url: string;
  title: string;
  description: string;
  isPrivate: boolean;
};

export type ApiErrorCode =
  | "bookmark.url_required"
  | "bookmark.url_invalid"
  | "bookmark.url_duplicate"
  | "bookmark.title_required"
  | "bookmark.id_invalid"
  | "bookmark.not_found"
  | "bookmark.unexpected";

export type ApiError = {
  message: string;
  code: ApiErrorCode;
  data?: Record<string, unknown>;
};

export type FormErrors = {
  url?: string;
  title?: string;
  form?: string;
};
