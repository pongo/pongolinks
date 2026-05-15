<script setup lang="ts">
import { LockIcon } from "@lucide/vue";
import { renderBookmarkDescriptionHtml } from "@pongolinks/shared/bookmark-description";
import { RouterLink } from "vue-router";

import type { BookmarkDTO } from "../../types";

import { useAppVariants } from "#/variants.ts";

defineProps<{
  bookmarks: BookmarkDTO[];
}>();

const { variants } = useAppVariants();
const bookmarkDescriptionHtmlOptions = {
  linkClassName: "bookmark-description-link",
};

function formatUpdatedAt(updatedAt: string) {
  const parsed = new Date(updatedAt);

  if (Number.isNaN(parsed.getTime())) {
    return updatedAt;
  }

  return formatDateAsYYYYMMDD(parsed);
}

function formatDateAsYYYYMMDD(date: Readonly<Date>): string {
  const yyyy = date.getFullYear();
  const mm = (date.getMonth() + 1).toString().padStart(2, "0");
  const dd = date.getDate().toString().padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatBookmarkDomain(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
</script>

<template>
  <ul
    class="ui-border-subtle ui-divide-subtle ui-surface divide-y"
    :class="[variants.bgBlue ? 'border-y' : 'border-0']"
  >
    <li v-for="bookmark in bookmarks" :key="bookmark.id" class="py-4">
      <div class="flex items-start justify-between gap-4" :class="{ 'px-4': variants.bgBlue }">
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <a
              class="ui-title-link text-base font-semibold wrap-break-word"
              :href="bookmark.url"
              rel="noreferrer"
              target="_blank"
            >
              {{ bookmark.title }}
            </a>
            <span
              v-if="bookmark.isPrivate"
              aria-label="Private bookmark"
              title="Private bookmark"
              class="ui-text-soft inline-flex items-center justify-center pt-px"
            >
              <LockIcon class="size-3.5" aria-hidden="true" />
            </span>
          </div>
          <div class="ui-text-muted mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span class="break-all">{{ formatBookmarkDomain(bookmark.url) }}</span>
            <span
              v-for="tag in bookmark.tags"
              :key="tag.id"
              class="ui-tag inline-flex max-w-full items-center border px-1.5 py-0.5 text-xs"
            >
              {{ tag.name }}
            </span>
          </div>
          <p
            v-if="bookmark.description"
            class="ui-text-readable mt-2 text-sm leading-6 whitespace-pre-wrap"
            v-html="
              renderBookmarkDescriptionHtml(bookmark.description, bookmarkDescriptionHtmlOptions)
            "
          ></p>
        </div>
        <div class="shrink-0 text-right">
          <RouterLink
            class="ui-muted-link text-sm font-semibold"
            :to="`/bookmarks/${bookmark.id}/edit`"
          >
            Edit
          </RouterLink>
          <p class="ui-text-soft mt-2 text-xs font-medium">
            {{ formatUpdatedAt(bookmark.updatedAt) }}
          </p>
        </div>
      </div>
    </li>
  </ul>
</template>

<style>
.bookmark-description-link {
  color: var(--ui-link-readable);
  text-decoration-line: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
}

.bookmark-description-link:hover {
  color: var(--ui-link);
}
</style>
