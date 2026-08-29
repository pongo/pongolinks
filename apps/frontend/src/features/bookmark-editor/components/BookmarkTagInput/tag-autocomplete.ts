import type { TagSummaryDTO } from "#/features/tags/types.ts";
import {
  currentToken,
  replaceCurrentToken,
} from "#/shared/components/autocomplete/tag-token-autocomplete.ts";

export function suggestTags(
  tags: TagSummaryDTO[],
  value: string,
  cursor: number,
  limit = 7,
): TagSummaryDTO[] {
  const token = currentToken(value, cursor);
  const queryLower = token.value.toLocaleLowerCase("und");

  if (!queryLower) {
    return [];
  }

  const otherTokens = value
    .slice(0, token.start)
    .concat(" ", value.slice(token.end))
    .split(/\s+/)
    .filter(Boolean)
    .map((tag) => tag.toLocaleLowerCase("und"));
  const otherTokenSet = new Set(otherTokens);

  const matchingTags = tags.filter(
    (tag) => tag.nameLower.includes(queryLower) && !otherTokenSet.has(tag.nameLower),
  );
  const exactMatch = matchingTags.find((tag) => tag.nameLower === queryLower);

  if (!exactMatch) {
    return matchingTags.slice(0, limit);
  }

  return [exactMatch, ...matchingTags.filter((tag) => tag !== exactMatch)].slice(0, limit);
}

export function replaceCurrentTagToken(
  value: string,
  cursor: number,
  tagName: string,
): { value: string; cursor: number } {
  return replaceCurrentToken(value, cursor, tagName);
}
