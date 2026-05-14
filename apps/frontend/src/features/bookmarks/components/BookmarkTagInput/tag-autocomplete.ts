import type { TagSummaryDTO } from "../../../tags/types";

export type TokenRange = {
  start: number;
  end: number;
  value: string;
};

export function currentTagToken(value: string, cursor: number): TokenRange {
  const safeCursor = Math.min(Math.max(cursor, 0), value.length);
  let start = safeCursor;
  let end = safeCursor;

  while (start > 0 && !/\s/.test(value[start - 1] ?? "")) {
    start -= 1;
  }

  while (end < value.length && !/\s/.test(value[end] ?? "")) {
    end += 1;
  }

  return {
    start,
    end,
    value: value.slice(start, end),
  };
}

export function suggestTags(
  tags: TagSummaryDTO[],
  value: string,
  cursor: number,
  limit = 7,
): TagSummaryDTO[] {
  const token = currentTagToken(value, cursor);
  const queryLower = token.value.toLocaleLowerCase();

  if (!queryLower) {
    return [];
  }

  const otherTokens = value
    .slice(0, token.start)
    .concat(" ", value.slice(token.end))
    .split(/\s+/)
    .filter(Boolean)
    .map((tag) => tag.toLocaleLowerCase());
  const otherTokenSet = new Set(otherTokens);

  return tags
    .filter(
      (tag) =>
        tag.nameLower.includes(queryLower) &&
        tag.nameLower !== queryLower &&
        !otherTokenSet.has(tag.nameLower),
    )
    .slice(0, limit);
}

export function replaceCurrentTagToken(
  value: string,
  cursor: number,
  tagName: string,
): { value: string; cursor: number } {
  const token = currentTagToken(value, cursor);
  const before = value.slice(0, token.start);
  const after = value.slice(token.end).replace(/^\s+/, "");
  const inserted = `${tagName} `;
  const nextValue = `${before}${inserted}${after}`;

  return {
    value: nextValue,
    cursor: before.length + inserted.length,
  };
}
