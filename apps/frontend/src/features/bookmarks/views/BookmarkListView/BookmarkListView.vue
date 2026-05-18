<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";

import { listBookmarks } from "../../api/api";
import type {
  BookmarkDTO,
  BookmarkListPagination as BookmarkListPaginationState,
} from "../../types";
import { useDelayedFlag } from "#/shared/useDelayedFlag.ts";
import BookmarkList from "./BookmarkList.vue";
import BookmarkListPagination from "./pagination/BookmarkListPagination.vue";
import BookmarkListSearchField from "./search/BookmarkListSearchField.vue";
import {
  isFilterActive,
  parseBookmarkListRouteQuery,
  parseMiniQueryToState,
  renderMiniQueryForContinuedInput,
  toggleDomainFilter,
  toggleIncludedTagFilter,
  toBookmarkListRouteQuery,
} from "./bookmark-list-query-state";

const route = useRoute();
const router = useRouter();
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
const queryState = computed(() => parseBookmarkListRouteQuery(route.query));
const searchText = ref("");
const { isDelayed, start: startLoadingDelay, stop: stopLoadingDelay } = useDelayedFlag(1000);
const isSearchActive = computed(() => isFilterActive(queryState.value));
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

watch(
  queryState,
  (nextState) => {
    const nextText = renderMiniQueryForContinuedInput(nextState);
    if (nextText !== searchText.value) {
      searchText.value = nextText;
    }
  },
  { immediate: true },
);

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

async function submitSearch() {
  const next = parseMiniQueryToState(searchText.value);
  await router.push({
    path: "/",
    query: toBookmarkListRouteQuery({
      ...next,
      page: 1,
    }),
  });
}

async function clearSearch() {
  searchText.value = "";
  await router.push("/");
}

async function onTagClick(tagName: string) {
  const nextState = toggleIncludedTagFilter(queryState.value, tagName);
  await router.push({
    path: "/",
    query: toBookmarkListRouteQuery(nextState),
  });
  searchText.value = renderMiniQueryForContinuedInput(nextState);
}

async function onDomainClick(domain: string) {
  const nextState = toggleDomainFilter(queryState.value, domain);
  await router.push({
    path: "/",
    query: toBookmarkListRouteQuery(nextState),
  });
  searchText.value = renderMiniQueryForContinuedInput(nextState);
}
</script>

<template>
  <main class="ui-page-text min-h-screen px-4 py-8 sm:px-6">
    <section class="mx-auto max-w-3xl">
      <header class="mb-7 flex items-center justify-between gap-4">
        <div>
          <RouterLink
            class="ui-link block cursor-pointer text-xs font-bold tracking-normal uppercase"
            to="/"
          >
            pongolinks
          </RouterLink>
          <RouterLink
            class="ui-text-strong mt-1 block cursor-pointer text-2xl font-bold select-none"
            to="/"
          >
            Bookmarks
          </RouterLink>
        </div>
        <RouterLink
          class="ui-action inline-flex min-h-10 items-center justify-center px-4 text-sm font-semibold transition select-none"
          to="/bookmarks/new"
        >
          New bookmark
        </RouterLink>
      </header>

      <BookmarkListSearchField
        v-model="searchText"
        :is-search-active="isSearchActive"
        @submit="submitSearch"
        @clear="clearSearch"
      />

      <p v-if="error" class="ui-danger-banner border-l-4 px-4 py-3 text-sm font-medium">
        {{ error }}
      </p>
      <p v-else-if="shouldShowLoadingMessage" class="ui-text-muted text-sm">Loading bookmarks...</p>

      <template v-else-if="shouldShowBookmarkContent">
        <div
          v-if="bookmarks.length === 0"
          class="ui-border ui-surface border border-dashed px-5 py-8"
        >
          <h2 class="ui-text-strong text-lg font-semibold">
            {{
              isNoMatchingBookmarks
                ? "No matching bookmarks"
                : isNoBookmarksYet
                  ? "No bookmarks yet"
                  : "No bookmarks on this page"
            }}
          </h2>
          <p class="ui-text-muted mt-2 text-sm">
            {{
              isNoMatchingBookmarks
                ? "Try another search or clear filters."
                : isNoBookmarksYet
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

        <BookmarkList
          v-else
          :bookmarks="bookmarks"
          :query-state="queryState"
          @tag-click="onTagClick"
          @domain-click="onDomainClick"
        />

        <BookmarkListPagination :pagination="pagination" :query-state="queryState" />
      </template>

      <footer class="ui-border-subtle mt-8 flex justify-end gap-4 border-t pt-4">
        <RouterLink class="ui-muted-link text-sm font-semibold select-none" to="/tags">
          Tags
        </RouterLink>
        <RouterLink class="ui-muted-link text-sm font-semibold select-none" to="/tools">
          Tools
        </RouterLink>
      </footer>
    </section>
  </main>
</template>
