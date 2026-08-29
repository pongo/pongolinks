import type { TagSummaryDTO } from "#/features/tags/types.ts";
import {
  currentToken,
  replaceCurrentToken,
  type TokenRange,
} from "#/shared/components/autocomplete/tag-token-autocomplete.ts";

export function suggestTags(
  tags: TagSummaryDTO[],
  value: string,
  cursor: number,
  limit = 7,
): TagSummaryDTO[] {
  const token = currentToken(value, cursor);
  const tokenLower = token.value.toLocaleLowerCase("und");
  if (!tokenLower) {
    return [];
  }

  const matchingTags = filterMatchingTags(value, token, tags, tokenLower);

  const exactMatch = matchingTags.find((tag) => tag.nameLower === tokenLower);
  if (exactMatch) {
    return [exactMatch, ...matchingTags.filter((tag) => tag !== exactMatch)].slice(0, limit);
  }

  return matchingTags.slice(0, limit);
}

function filterMatchingTags(
  value: string,
  token: TokenRange,
  tags: TagSummaryDTO[],
  tokenLower: string,
) {
  const otherTokens = value
    .slice(0, token.start)
    .concat(" ", value.slice(token.end))
    .split(/\s+/)
    .filter(Boolean)
    .map((tag) => tag.toLocaleLowerCase("und"));
  const otherTokenSet = new Set(otherTokens);

  return tags.filter(
    (tag) => tag.nameLower.includes(tokenLower) && !otherTokenSet.has(tag.nameLower),
  );
}

export function replaceCurrentTagToken(
  value: string,
  cursor: number,
  tagName: string,
): { value: string; cursor: number } {
  return replaceCurrentToken(value, cursor, tagName);
}
