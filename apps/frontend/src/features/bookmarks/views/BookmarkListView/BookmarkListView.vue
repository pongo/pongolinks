<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";

import { listBookmarks } from "../../api/api";
import type {
  BookmarkDTO,
  BookmarkListPagination as BookmarkListPaginationState,
} from "../../types";
import { useDelayedFlag } from "#/shared/useDelayedFlag.ts";
import BookmarkList from "./BookmarkList.vue";
import BookmarkListPagination from "./BookmarkListPagination.vue";
import { normalizeBookmarkListPageQuery } from "./pagination-window";

const route = useRoute();
const bookmarks = ref<BookmarkDTO[]>([]);
const pagination = ref<BookmarkListPaginationState>({
  page: 1,
  pageSize: 3,
  totalCount: 0,
  totalPages: 0,
  hasPreviousPage: false,
  hasNextPage: false,
});
const isLoading = ref(true);
const error = ref("");
const currentPage = computed(() => normalizeBookmarkListPageQuery(route.query.page));
const { isDelayed, start: startLoadingDelay, stop: stopLoadingDelay } = useDelayedFlag(1000);

watch(
  currentPage,
  async (page, _previousPage, onCleanup) => {
    let isCurrentRequest = true;
    startLoadingDelay();

    onCleanup(() => {
      isCurrentRequest = false;
      stopLoadingDelay();
    });

    isLoading.value = true;
    error.value = "";

    const result = await listBookmarks(page);

    if (!isCurrentRequest) {
      return;
    }

    stopLoadingDelay();

    if (result.isOk) {
      bookmarks.value = result.value.bookmarks;
      pagination.value = result.value.pagination;
    } else {
      error.value = result.error.formErrors.form ?? result.error.message;
    }

    isLoading.value = false;
  },
  { immediate: true },
);
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

      <p v-if="error" class="ui-danger-banner border-l-4 px-4 py-3 text-sm font-medium">
        {{ error }}
      </p>
      <p v-else-if="isLoading && isDelayed && bookmarks.length === 0" class="ui-text-muted text-sm">
        Loading bookmarks...
      </p>

      <template v-else>
        <div
          v-if="bookmarks.length === 0"
          class="ui-border ui-surface border border-dashed px-5 py-8"
        >
          <h2 class="ui-text-strong text-lg font-semibold">
            {{ pagination.totalCount === 0 ? "No bookmarks yet" : "No bookmarks on this page" }}
          </h2>
          <p class="ui-text-muted mt-2 text-sm">
            {{
              pagination.totalCount === 0
                ? "Save the first link you want to keep close."
                : "Choose another page to continue browsing saved links."
            }}
          </p>
          <RouterLink
            v-if="pagination.totalCount === 0"
            class="ui-action mt-5 inline-flex min-h-10 items-center justify-center px-4 text-sm font-semibold transition"
            to="/bookmarks/new"
          >
            Create bookmark
          </RouterLink>
        </div>

        <BookmarkList v-else :bookmarks="bookmarks" />

        <BookmarkListPagination :pagination="pagination" />
      </template>
    </section>
  </main>
</template>
