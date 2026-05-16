import { Err, Ok, type Result } from "@pongolinks/shared/result";

import { ApiError } from "#/http/result-response.ts";

export class BookmarkUrl {
  private constructor(private readonly rawValue: string) {}

  static from(input: unknown): Result<BookmarkUrl, ApiError> {
    if (typeof input !== "string" || input.trim() === "") {
      return Err(new ApiError("Bookmark URL is required", "bookmark.url_required", 400));
    }

    const trimmed = input.trim();

    try {
      const parsed = new URL(trimmed);

      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return Err(
          new ApiError("Bookmark URL must use http or https", "bookmark.url_invalid", 400),
        );
      }

      return Ok(new BookmarkUrl(trimmed));
    } catch {
      return Err(new ApiError("Bookmark URL must be an absolute URL", "bookmark.url_invalid", 400));
    }
  }

  value(): string {
    return this.rawValue;
  }
}
