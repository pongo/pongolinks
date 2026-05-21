import { and, sql, type SQL } from "drizzle-orm";
import type { BookmarkFilterMode } from "@pongolinks/shared/bookmark-filter";

import { bookmarks } from "@pongolinks/db/schema";

function escapeFtsToken(token: string) {
  return token.replaceAll('"', '""');
}

function buildDomainFilterCondition(domain: string) {
  const patterns = [
    `http://${domain}`,
    `http://${domain}/%`,
    `http://${domain}?%`,
    `http://${domain}#%`,
    `http://${domain}:%`,
    `https://${domain}`,
    `https://${domain}/%`,
    `https://${domain}?%`,
    `https://${domain}#%`,
    `https://${domain}:%`,
  ];

  return sql`(${sql.join(
    patterns.map((pattern) => sql`${bookmarks.url} LIKE ${pattern}`),
    sql` OR `,
  )})`;
}

function buildQueryTokenCondition(token: string) {
  const tokenLower = token.toLocaleLowerCase("und");
  const ordinaryPattern = `%${tokenLower}%`;
  const ftsMatch = `"${escapeFtsToken(token)}"*`;

  return sql`(
    EXISTS (
      SELECT 1
      FROM bookmarks_fts
      WHERE bookmarks_fts.rowid = ${bookmarks.id}
        AND bookmarks_fts MATCH ${ftsMatch}
    )
    OR LOWER(${bookmarks.url}) LIKE ${ordinaryPattern}
    OR EXISTS (
      SELECT 1
      FROM related_links
      WHERE related_links.bookmark_id = ${bookmarks.id}
        AND LOWER(related_links.url) LIKE ${ordinaryPattern}
    )
    OR EXISTS (
      SELECT 1
      FROM bookmark_tags
      INNER JOIN tags ON bookmark_tags.tag_id = tags.id
      WHERE bookmark_tags.bookmark_id = ${bookmarks.id}
        AND tags.name_lower LIKE ${ordinaryPattern}
    )
  )`;
}

export function buildBookmarkFilterCondition(filter: BookmarkFilterMode): SQL | undefined {
  if (filter.kind === "urlLookup") {
    return undefined;
  }

  const whereConditions: SQL[] = [];
  if (filter.domain) {
    whereConditions.push(buildDomainFilterCondition(filter.domain));
  }
  for (const token of filter.qTokens) {
    whereConditions.push(buildQueryTokenCondition(token));
  }
  for (const includeTagNameLower of filter.includeTagNamesLower) {
    whereConditions.push(
      sql`EXISTS (
        SELECT 1
        FROM bookmark_tags
        INNER JOIN tags ON bookmark_tags.tag_id = tags.id
        WHERE bookmark_tags.bookmark_id = ${bookmarks.id}
          AND tags.name_lower = ${includeTagNameLower}
      )`,
    );
  }
  for (const excludeTagNameLower of filter.excludeTagNamesLower) {
    whereConditions.push(
      sql`NOT EXISTS (
        SELECT 1
        FROM bookmark_tags
        INNER JOIN tags ON bookmark_tags.tag_id = tags.id
        WHERE bookmark_tags.bookmark_id = ${bookmarks.id}
          AND tags.name_lower = ${excludeTagNameLower}
      )`,
    );
  }

  return whereConditions.length > 0 ? and(...whereConditions) : undefined;
}
