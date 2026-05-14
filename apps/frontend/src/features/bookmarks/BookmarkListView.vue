<script setup lang="ts">
import { LockIcon } from "@lucide/vue";
import { onMounted, ref } from "vue";
import { RouterLink } from "vue-router";

import { autolinkBookmarkDescription } from "./autolink-description";
import { listBookmarks } from "./api";
import type { BookmarkDTO } from "./types";

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
  <main class="min-h-screen px-4 py-8 text-slate-900 sm:px-6">
    <section class="mx-auto max-w-3xl">
      <header class="mb-7 flex items-center justify-between gap-4">
        <div>
          <p class="text-xs font-bold tracking-normal text-blue-800 uppercase">pongolinks</p>
          <h1 class="mt-1 text-2xl font-bold text-slate-950">Bookmarks</h1>
        </div>
        <RouterLink
          class="inline-flex min-h-10 items-center justify-center bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800"
          to="/bookmarks/new"
        >
          New bookmark
        </RouterLink>
      </header>

      <p v-if="isLoading" class="text-sm text-slate-600">Loading bookmarks...</p>
      <p
        v-else-if="error"
        class="border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
      >
        {{ error }}
      </p>

      <div
        v-else-if="bookmarks.length === 0"
        class="border border-dashed border-slate-300 bg-white px-5 py-8"
      >
        <h2 class="text-lg font-semibold text-slate-950">No bookmarks yet</h2>
        <p class="mt-2 text-sm text-slate-600">Save the first link you want to keep close.</p>
        <RouterLink
          class="mt-5 inline-flex min-h-10 items-center justify-center bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800"
          to="/bookmarks/new"
        >
          Create bookmark
        </RouterLink>
      </div>

      <ul v-else class="divide-y divide-slate-200 border-y border-slate-200 bg-white">
        <li v-for="bookmark in bookmarks" :key="bookmark.id" class="py-4">
          <div class="flex items-start justify-between gap-4 px-4">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <a
                  class="text-base font-semibold wrap-break-word text-slate-950 hover:text-blue-800"
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
                  class="inline-flex items-center justify-center pt-px text-slate-500"
                >
                  <LockIcon class="size-3.5" aria-hidden="true" />
                </span>
              </div>
              <div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
                <span class="break-all">{{ formatBookmarkDomain(bookmark.url) }}</span>
                <span
                  v-for="tag in bookmark.tags"
                  :key="tag.id"
                  class="inline-flex max-w-full items-center border border-[#eee] px-1.5 py-0.5 text-xs text-slate-600"
                >
                  {{ tag.name }}
                </span>
              </div>
              <p
                v-if="bookmark.description"
                class="mt-2 text-sm leading-6 whitespace-pre-wrap text-slate-700"
                v-html="autolinkBookmarkDescription(bookmark.description)"
              ></p>
            </div>
            <div class="shrink-0 text-right">
              <RouterLink
                class="text-sm font-semibold text-slate-800 hover:text-red-500"
                :to="`/bookmarks/${bookmark.id}/edit`"
              >
                Edit
              </RouterLink>
              <p class="mt-2 text-xs font-medium text-slate-500">
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
  color: #1d4ed8;
  text-decoration-line: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
}

.bookmark-description-link:hover {
  color: #1e40af;
}
</style>
