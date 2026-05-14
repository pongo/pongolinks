import { Err, Ok, type Result } from "@pongolinks/shared/result";

import { ApiError } from "#/http/result-response.ts";

export class BookmarkId {
  private constructor(private readonly rawValue: number) {}

  static from(input: unknown): Result<BookmarkId, ApiError> {
    const value =
      typeof input === "number"
        ? input
        : typeof input === "string" && input.trim() !== ""
          ? Number(input)
          : Number.NaN;

    if (!Number.isSafeInteger(value) || value <= 0) {
      return Err(
        new ApiError("Bookmark id must be a positive safe integer", "bookmark.id_invalid", 400),
      );
    }

    return Ok(new BookmarkId(value));
  }

  value(): number {
    return this.rawValue;
  }
}
