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

export type EditableBookmarkPayload = {
  url: string;
  title: string;
  description: string;
  isPrivate: boolean;
  tagsText: string;
};

export type ApiErrorCode =
  | "bookmark.url_required"
  | "bookmark.url_invalid"
  | "bookmark.url_duplicate"
  | "bookmark.title_required"
  | "bookmark.id_invalid"
  | "bookmark.not_found"
  | "bookmark.tags_invalid"
  | "bookmark.validation_invalid"
  | "bookmark.unexpected";

export type FormErrors = {
  url?: string;
  title?: string;
  form?: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: ApiErrorCode,
    readonly data?: Record<string, unknown>,
    readonly formErrors: FormErrors = { form: message },
  ) {
    super(message);
    this.name = "ApiError";
  }
}
