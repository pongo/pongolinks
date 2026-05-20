<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";

import { listBookmarks } from "../../api/api";
import type {
  BookmarkDTO,
  BookmarkListPagination as BookmarkListPaginationState,
} from "../../types";
import { useDelayedFlag } from "#/shared/composables/useDelayedFlag.ts";
import BookmarkList from "./ui/BookmarkList.vue";
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
  type BookmarkListRouteState,
} from "../../utils/bookmark-list-query-state.ts";

import { useAppVariants } from "#/variants.ts";
import BookmarksEmptyState from "./ui/BookmarksEmptyState.vue";
const { variants } = useAppVariants();

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

type BookmarksEmptyVariant = "no-match" | "no-bookmarks" | "no-page";
const emptyStateVariant = computed<BookmarksEmptyVariant>(() => {
  if (isNoMatchingBookmarks.value) return "no-match";
  if (isNoBookmarksYet.value) return "no-bookmarks";
  return "no-page";
});

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

async function applyQueryState(nextState: BookmarkListRouteState) {
  await router.push({
    path: "/",
    query: toBookmarkListRouteQuery(nextState),
  });

  searchText.value = renderMiniQueryForContinuedInput(nextState);
}

async function onTagClick(tagName: string) {
  await applyQueryState(toggleIncludedTagFilter(queryState.value, tagName));
}

async function onDomainClick(domain: string) {
  await applyQueryState(toggleDomainFilter(queryState.value, domain));
}
</script>

<template>
  <main class="ui-page-text min-h-screen px-4 py-8 sm:px-6">
    <section class="mx-auto max-w-3xl">
      <header class="mb-7 flex items-center justify-between gap-4 select-none">
        <div>
          <RouterLink
            v-if="variants.showFavIcon"
            class="ui-link flex h-4 cursor-pointer items-center gap-1.25 text-xs font-bold tracking-normal uppercase"
            to="/"
          >
            <img
              class="h-4 w-4 shrink-0"
              src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAq1BMVEUAAAAAMbEKNas9VZd9fX43UplSY48ENK4NOKwSOqxIXZNPYZArTJ0yUJsvTZsAM7IAMrEAMrL///8AM7MAH6r8/f2mtuIAK68AJq74+fyFnNkAMLIAIqwAEaYAJ7kTQrcALrUlUL3///7+/f3I0u6tvOXCzuzv8vkxWsEkSroNO7QAG6nf5fWer+B/lddsiNIvVb91j9RcdstQcslKacbP1++zweeMotuHntq/2SSvAAAAD3RSTlMA/OeDC4tZ9ePZbF+gmZi7udEeAAAB6ElEQVQ4y12TiZKbMAyGTUI2SbctlmUCWRNKQnMfmz16vP+T9ZcMdGe/YYJjfZZsjTHKeGQzwJzhrbAdjU3PwzwhmYshItK3TeYP3fK6kWkNIoGqBCFr6rGur1nCOofH9pksZaFGjnTW2C6YFR0ER1TbzFIzCVZ9y2V1+qGcSm+jYsPETAmqJPDH7X6p7HevvujKTE2AJzWq9dL951oFhAEZiSJFKC4ub91mI49r3Z8za15rECSY/g3xX8c1OL7uN607lqTb0AxQzleXu925FFaHPHc3rwtVAOQXEH6WaBIx+51z2woL4ZiMtCedwPxB0OKGYEDphYA+rdbL1j15xCWD9rDPoL06vV8wvpcaRwYYg3C+Sa8chgvPOEIULJwo/D44AY3YFQVjGpIK1AnbZ6dcXsqC9WpwZrBenE74e78fDmvygVFfUuse4PWbXClYDuLxkAEVWI+Z59vrAryIQFpiaHWmQusizxUT0O0beVtiETr0jJxxlAxHEYIcP/JWMYh3yrC1MvC3p4H3kgmCxTSEJN64cuUHKtbmaiAx3wMGgAfEF0QJX006auR/phYm+xPqdWmmqTGPdWwLx49DFVbbUv3FgEmNHF1UC2gco6b+ZpTHeSJFIqQ/0j6a6fru8w/2M6NJasA/ltpKo8JMfD0AAAAASUVORK5CYII="
              alt=""
              aria-hidden="true"
            />
            pongolinks
          </RouterLink>
          <RouterLink
            v-else
            class="ui-link block cursor-pointer text-xs font-bold tracking-normal uppercase"
            to="/"
          >
            pongolinks
          </RouterLink>
          <RouterLink class="ui-text-strong mt-1 block cursor-pointer text-2xl font-bold" to="/">
            Bookmarks
          </RouterLink>
        </div>
        <RouterLink
          class="ui-action inline-flex min-h-10 items-center justify-center px-4 text-sm font-semibold transition"
          to="/bookmarks/new"
        >
          New bookmark
        </RouterLink>
      </header>

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
