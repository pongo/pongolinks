import type { TagSummaryDTO } from "#/features/tags/types.ts";
import { currentToken, replaceCurrentToken } from "../../components/tag-token-autocomplete";

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

  return tags
    .filter((tag) => tag.nameLower.includes(queryLower) && tag.nameLower !== queryLower)
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
