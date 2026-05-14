<script setup lang="ts">
import { LockIcon } from "@lucide/vue";
import { onMounted, ref, watchEffect } from "vue";
import { RouterLink } from "vue-router";
import { autolinkBookmarkDescription } from "./autolink-description";
import { listBookmarks } from "../../api/api";
import type { BookmarkDTO } from "../../types";

import { useAppVariants } from "#/variants.ts";
const { variants } = useAppVariants();

const bookmarks = ref<BookmarkDTO[]>([]);
const isLoading = ref(true);
const error = ref("");

function formatUpdatedAt(updatedAt: string) {
  const parsed = new Date(updatedAt);

  if (Number.isNaN(parsed.getTime())) {
    return updatedAt;
  }

  return YYYYMMDD(parsed);
}

/**
 * Converts a Date object to a string in the format YYYY-MM-DD.
 *
 * @param {Date} date - The date to be converted.
 * @returns {string} The formatted date string.
 */
function YYYYMMDD(date: Readonly<Date>): string {
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

onMounted(async () => {
  const result = await listBookmarks();

  if (result.isOk) {
    bookmarks.value = result.value.bookmarks;
  } else {
    error.value = result.error.formErrors.form ?? result.error.message;
  }

  isLoading.value = false;
});
</script>

<template>
  <main class="ui-page-text min-h-screen px-4 py-8 sm:px-6">
    <section class="mx-auto max-w-3xl">
      <header class="mb-7 flex items-center justify-between gap-4">
        <div>
          <p class="ui-link text-xs font-bold tracking-normal uppercase">pongolinks</p>
          <h1 class="ui-text-strong mt-1 text-2xl font-bold">Bookmarks</h1>
        </div>
        <RouterLink
          class="ui-action inline-flex min-h-10 items-center justify-center px-4 text-sm font-semibold transition"
          to="/bookmarks/new"
        >
          New bookmark
        </RouterLink>
      </header>

      <p v-if="isLoading" class="ui-text-muted text-sm">Loading bookmarks...</p>
      <p v-else-if="error" class="ui-danger-banner border-l-4 px-4 py-3 text-sm font-medium">
        {{ error }}
      </p>

      <div
        v-else-if="bookmarks.length === 0"
        class="ui-border ui-surface border border-dashed px-5 py-8"
      >
        <h2 class="ui-text-strong text-lg font-semibold">No bookmarks yet</h2>
        <p class="ui-text-muted mt-2 text-sm">Save the first link you want to keep close.</p>
        <RouterLink
          class="ui-action mt-5 inline-flex min-h-10 items-center justify-center px-4 text-sm font-semibold transition"
          to="/bookmarks/new"
        >
          Create bookmark
        </RouterLink>
      </div>

      <ul
        v-else
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
                v-html="autolinkBookmarkDescription(bookmark.description)"
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
    </section>
  </main>
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
