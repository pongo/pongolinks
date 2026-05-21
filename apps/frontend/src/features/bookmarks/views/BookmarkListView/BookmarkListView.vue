<script setup lang="ts">
import { computed, ref, watch } from "vue";

import { listBookmarks } from "../../api/api";
import type {
  BookmarkDTO,
  BookmarkListPagination as BookmarkListPaginationState,
} from "../../types";
import { useDelayedFlag } from "#/shared/composables/useDelayedFlag.ts";
import BookmarkList from "./ui/BookmarkList.vue";
import BookmarkListPagination from "./pagination/BookmarkListPagination.vue";
import BookmarkListSearchField from "./search/BookmarkListSearchField.vue";
import BookmarksEmptyState from "./ui/BookmarksEmptyState.vue";
import { useBookmarkQuery } from "./composables/useBookmarkQuery.ts";
import BookmarkListHeader from "./ui/BookmarkListHeader.vue";
import BookmarkListFooter from "./ui/BookmarkListFooter.vue";

const {
  queryState,
  searchText,
  isSearchActive,
  submitSearch,
  clearSearch,
  onTagClick,
  onDomainClick,
} = useBookmarkQuery();

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

const { isDelayed, start: startLoadingDelay, stop: stopLoadingDelay } = useDelayedFlag(500);

const shouldShowLoadingMessage = computed(
  () => isLoading.value && isDelayed.value && bookmarks.value.length === 0,
);
const shouldShowBookmarkContent = computed(() => !isLoading.value || bookmarks.value.length > 0);
const isNoMatchingBookmarks = computed(
  () => bookmarks.value.length === 0 && pagination.value.totalCount === 0 && isSearchActive.value,
);
const isNoBookmarksYet = computed(
  () => bookmarks.value.length === 0 && pagination.value.totalCount === 0 && !isSearchActive.value,
);

type BookmarksEmptyVariant = "no-match" | "no-bookmarks" | "no-page";
const emptyStateVariant = computed<BookmarksEmptyVariant>(() => {
  if (isNoMatchingBookmarks.value) return "no-match";
  if (isNoBookmarksYet.value) return "no-bookmarks";
  return "no-page";
});

watch(
  queryState,
  async (state, _previousState, onCleanup) => {
    let isCurrentRequest = true;
    startLoadingDelay();

    onCleanup(() => {
      isCurrentRequest = false;
      stopLoadingDelay();
    });

    isLoading.value = true;
    error.value = "";

    const result = await listBookmarks({
      q: state.q ?? undefined,
      tag: state.tags.length > 0 ? state.tags : undefined,
      domain: state.domain ?? undefined,
      url: state.url ?? undefined,
      page: state.page,
    });

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
      <BookmarkListHeader />

      <BookmarkListSearchField v-model="searchText" @submit="submitSearch" @clear="clearSearch" />

      <p v-if="error" class="ui-danger-banner border-l-4 px-4 py-3 text-sm font-medium">
        {{ error }}
      </p>
      <p v-else-if="shouldShowLoadingMessage" class="ui-text-muted text-sm">Loading bookmarks...</p>

      <template v-else-if="shouldShowBookmarkContent">
        <div
          v-if="bookmarks.length === 0"
          class="ui-border ui-surface border border-dashed px-5 py-8"
        >
          <BookmarksEmptyState :variant="emptyStateVariant" />
          <RouterLink
            v-if="isNoBookmarksYet"
            class="ui-action mt-5 inline-flex min-h-10 items-center justify-center px-4 text-sm font-semibold transition"
            to="/bookmarks/new"
          >
            Create bookmark
          </RouterLink>
        </div>

        <BookmarkList
          v-else
          :bookmarks="bookmarks"
          :query-state="queryState"
          @tag-click="onTagClick"
          @domain-click="onDomainClick"
          :class="{ 'cursor-progress opacity-50 **:cursor-progress!': isLoading && isDelayed }"
        />

        <BookmarkListPagination :pagination="pagination" :query-state="queryState" />
      </template>

      <BookmarkListFooter />
    </section>
  </main>
</template>
