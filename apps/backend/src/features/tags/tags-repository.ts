import { asc, desc } from "drizzle-orm";
import type { Result } from "@pongolinks/shared/result";
import { Err, Ok } from "@pongolinks/shared/result";

import { tags } from "@pongolinks/db/schema";

import type { AppDb } from "#/db/app-db.ts";
import { type ApiError, unexpectedError } from "#/http/result-response.ts";
import type { TagSummaryDTO } from "./contracts";

export class TagsRepository {
  constructor(private readonly db: AppDb) {}

  async list(): Promise<Result<{ tags: TagSummaryDTO[] }, ApiError>> {
    try {
      const rows = await this.db
        .select({
          id: tags.id,
          name: tags.name,
          nameLower: tags.nameLower,
          usageCount: tags.usageCount,
        })
        .from(tags)
        .orderBy(desc(tags.usageCount), asc(tags.nameLower))
        .all();

      return Ok({ tags: rows });
    } catch (error) {
      return Err(unexpectedError(error));
    }
  }
}
