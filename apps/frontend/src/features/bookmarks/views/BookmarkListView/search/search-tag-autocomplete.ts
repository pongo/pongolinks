import type { TagSummaryDTO } from "#/features/tags/types.ts";
import {
  currentToken,
  replaceCurrentToken,
} from "../../../components/autocomplete/tag-token-autocomplete.ts";

export function suggestSearchFieldTags(
  tags: TagSummaryDTO[],
  value: string,
  cursor: number,
  limit = 7,
): TagSummaryDTO[] {
  const token = currentToken(value, cursor);
  const includeMode = token.value.startsWith("#");
  const excludeMode = token.value.startsWith("-#");
  if (!includeMode && !excludeMode) {
    return [];
  }

  const rawQuery = excludeMode ? token.value.slice(2) : token.value.slice(1);
  const queryLower = rawQuery.toLocaleLowerCase("und");
  if (!queryLower) {
    return [];
  }

  const otherTokens = value
    .slice(0, token.start)
    .concat(" ", value.slice(token.end))
    .split(/\s+/)
    .filter(Boolean)
    .map((otherToken) => {
      if (otherToken.startsWith("-#")) {
        return otherToken.slice(2).toLocaleLowerCase("und");
      }

      if (otherToken.startsWith("#")) {
        return otherToken.slice(1).toLocaleLowerCase("und");
      }

      return undefined;
    })
    .filter((tagName): tagName is string => Boolean(tagName));
  const otherTokenSet = new Set(otherTokens);

  return tags
    .filter((tag) => tag.nameLower.includes(queryLower) && !otherTokenSet.has(tag.nameLower))
    .slice(0, limit);
}

export function replaceCurrentSearchTagToken(
  value: string,
  cursor: number,
  tagName: string,
): { value: string; cursor: number } {
  const token = currentToken(value, cursor);
  const excludeMode = token.value.startsWith("-#");
  const insertedToken = excludeMode ? `-#${tagName}` : `#${tagName}`;

  return replaceCurrentToken(value, cursor, insertedToken);
}
