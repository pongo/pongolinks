import { asc, desc, sql } from "drizzle-orm";
import type { Result } from "@pongolinks/shared/result";
import { Err, Ok } from "@pongolinks/shared/result";

import { bookmarkTags, tags } from "@pongolinks/db/schema";

import { type ApiError, unexpectedError } from "../../http/result-response";
import type { AppDb } from "../bookmarks/bookmarks-repository";
import type { TagSummaryDTO } from "./contracts";

export class TagsRepository {
  constructor(private readonly db: AppDb) {}

  async list(): Promise<Result<{ tags: TagSummaryDTO[] }, ApiError>> {
    try {
      const usageCount = sql<number>`count(${bookmarkTags.bookmarkId})`;
      const rows = await this.db
        .select({
          id: tags.id,
          name: tags.name,
          nameLower: tags.nameLower,
          usageCount,
        })
        .from(tags)
        .leftJoin(bookmarkTags, sql`${bookmarkTags.tagId} = ${tags.id}`)
        .groupBy(tags.id)
        .orderBy(desc(usageCount), asc(tags.nameLower))
        .all();

      return Ok({ tags: rows });
    } catch (error) {
      return Err(unexpectedError(error));
    }
  }
}
