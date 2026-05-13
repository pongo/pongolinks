<script setup lang="ts">
import { onMounted, ref } from "vue";
import { RouterLink } from "vue-router";

import { listBookmarks } from "./api";
import type { BookmarkDTO } from "./types";

const bookmarks = ref<BookmarkDTO[]>([]);
const isLoading = ref(true);
const error = ref("");

const timestampFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatUpdatedAt(updatedAt: string) {
  const parsed = new Date(updatedAt);

  if (Number.isNaN(parsed.getTime())) {
    return updatedAt;
  }

  return timestampFormatter.format(parsed);
}

onMounted(async () => {
  const result = await listBookmarks();

  if (result.ok) {
    bookmarks.value = result.data.bookmarks;
  } else {
    error.value = result.errors.form ?? result.error.message;
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
                  class="text-base font-semibold break-words text-slate-950 hover:text-blue-800"
                  :href="bookmark.url"
                  rel="noreferrer"
                  target="_blank"
                >
                  {{ bookmark.title }}
                </a>
                <span
                  v-if="bookmark.isPrivate"
                  class="border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800"
                >
                  Private
                </span>
              </div>
              <p class="mt-1 text-sm break-all text-slate-600">{{ bookmark.url }}</p>
              <p
                v-if="bookmark.description"
                class="mt-2 text-sm leading-6 whitespace-pre-wrap text-slate-700"
              >
                {{ bookmark.description }}
              </p>
              <p class="mt-2 text-xs font-medium text-slate-500">
                {{ formatUpdatedAt(bookmark.updatedAt) }}
              </p>
            </div>
            <RouterLink
              class="shrink-0 text-sm font-semibold text-blue-800 hover:text-blue-950"
              :to="`/bookmarks/${bookmark.id}/edit`"
            >
              Edit
            </RouterLink>
          </div>
        </li>
      </ul>
    </section>
  </main>
</template>
