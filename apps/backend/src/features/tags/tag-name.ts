import { Err, Ok, type Result } from "@pongolinks/shared/result";
import { StacklessError } from "@pongolinks/shared/errors";

import { ApiError } from "#/http/result-response.ts";

export class TagNameError extends StacklessError {
  constructor(message: string) {
    super(message);
  }
}

export class TagName {
  private constructor(
    private readonly displayName: string,
    private readonly normalizedName: string,
  ) {}

  static from(input: string): Result<TagName, TagNameError> {
    const name = input.trim();

    if (name === "" || /\s/u.test(name)) {
      return Err(new TagNameError("Tag name must be a non-empty token without whitespace"));
    }

    return Ok(new TagName(name, name.toLocaleLowerCase("und")));
  }

  name() {
    return this.displayName;
  }

  nameLower() {
    return this.normalizedName;
  }
}

function tagNameApiError(error: TagNameError, code: "bookmark.tags_invalid" | "tag.name_invalid") {
  return new ApiError(error.message, code, 400);
}

export function parseTagNames(tagsText: string): Result<TagName[], ApiError> {
  const unique = new Map<string, TagName>();

  for (const token of tagsText.split(/\s+/u)) {
    if (token === "") {
      continue;
    }

    const tagName = TagName.from(token);
    if (tagName.isErr) {
      return Err(tagNameApiError(tagName.error, "bookmark.tags_invalid"));
    }

    if (!unique.has(tagName.value.nameLower())) {
      unique.set(tagName.value.nameLower(), tagName.value);
    }
  }

  return Ok(
    [...unique.values()].sort((left, right) => left.nameLower().localeCompare(right.nameLower())),
  );
}

export function parseSubmittedTagName(name: string): Result<TagName, ApiError> {
  const tagName = TagName.from(name);

  if (tagName.isErr) {
    return Err(tagNameApiError(tagName.error, "tag.name_invalid"));
  }

  return tagName;
}
