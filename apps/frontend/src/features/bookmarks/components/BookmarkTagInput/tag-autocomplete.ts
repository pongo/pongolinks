import type { TagSummaryDTO } from "#/features/tags/types.ts";
import { currentToken, replaceCurrentToken, type TokenRange } from "../tag-token-autocomplete";

export function currentTagToken(value: string, cursor: number): TokenRange {
  return currentToken(value, cursor);
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
  return replaceCurrentToken(value, cursor, tagName);
}
