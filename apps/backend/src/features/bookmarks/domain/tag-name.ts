import { Err, Ok, type Result } from "@pongolinks/shared/result";

import { ApiError } from "#/http/result-response.ts";

export class TagName {
  private constructor(
    private readonly displayName: string,
    private readonly normalizedName: string,
  ) {}

  static from(input: string): Result<TagName, ApiError> {
    const name = input.trim();

    if (name === "" || /\s/u.test(name)) {
      return Err(
        new ApiError(
          "Tags must be non-empty names without whitespace",
          "bookmark.tags_invalid",
          400,
        ),
      );
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

export function parseTagNames(tagsText: string): Result<TagName[], ApiError> {
  const unique = new Map<string, TagName>();

  for (const token of tagsText.split(/\s+/u)) {
    if (token === "") {
      continue;
    }

    const tagName = TagName.from(token);
    if (tagName.isErr) {
      return tagName;
    }

    if (!unique.has(tagName.value.nameLower())) {
      unique.set(tagName.value.nameLower(), tagName.value);
    }
  }

  return Ok(
    [...unique.values()].sort((left, right) => left.nameLower().localeCompare(right.nameLower())),
  );
}
