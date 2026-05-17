import { StacklessError } from "@pongolinks/shared/errors";

export type ApiErrorCode =
  | "bookmark.url_required"
  | "bookmark.url_invalid"
  | "bookmark.url_duplicate"
  | "bookmark.title_required"
  | "bookmark.id_invalid"
  | "bookmark.not_found"
  | "bookmark.tags_invalid"
  | "bookmark.validation_invalid"
  | "bookmark.unexpected"
  | "tag.name_invalid"
  | "tag.not_found"
  | "tag.conflict"
  | "tag.unexpected";

export type FormErrors = {
  url?: string;
  title?: string;
  form?: string;
};

export class ApiError extends StacklessError {
  constructor(
    message: string,
    readonly code: ApiErrorCode,
    data?: Record<string, unknown>,
    readonly formErrors: FormErrors = { form: message },
  ) {
    super(message, data);
  }
}
