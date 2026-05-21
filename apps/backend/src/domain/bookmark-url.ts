import { Err, Ok, type Result } from "@pongolinks/shared/result";

import type { ValidUrl } from "@pongolinks/shared/brands";

export type BookmarkUrlErrorKind = "required" | "invalid";

export class BookmarkUrlError extends Error {
  constructor(
    message: string,
    readonly kind: BookmarkUrlErrorKind,
  ) {
    super(message);
    this.name = "BookmarkUrlError";
  }
}

export class BookmarkUrl {
  private constructor(private readonly rawValue: string) {}

  static from(input: unknown): Result<BookmarkUrl, BookmarkUrlError> {
    if (typeof input !== "string" || input.trim() === "") {
      return Err(new BookmarkUrlError("Bookmark URL is required", "required"));
    }

    const trimmed = input.trim();

    try {
      const parsed = new URL(trimmed);

      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return Err(new BookmarkUrlError("Bookmark URL must use http or https", "invalid"));
      }

      return Ok(new BookmarkUrl(trimmed));
    } catch {
      return Err(new BookmarkUrlError("Bookmark URL must be an absolute URL", "invalid"));
    }
  }

  value(): ValidUrl {
    return this.rawValue as ValidUrl;
  }
}
