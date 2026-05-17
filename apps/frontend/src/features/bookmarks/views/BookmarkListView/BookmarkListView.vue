<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";

import { listBookmarks } from "../../api/api";
import { listTags } from "#/features/tags/api.ts";
import type { TagSummaryDTO } from "#/features/tags/types.ts";
import type {
  BookmarkDTO,
  BookmarkListPagination as BookmarkListPaginationState,
} from "../../types";
import { useDelayedFlag } from "#/shared/useDelayedFlag.ts";
import BookmarkList from "./BookmarkList.vue";
import BookmarkListPagination from "./BookmarkListPagination.vue";
import {
  isFilterActive,
  parseBookmarkListRouteQuery,
  parseMiniQueryToState,
  renderMiniQueryFromState,
  toggleDomainFilter,
  toggleIncludedTagFilter,
  toBookmarkListRouteQuery,
} from "./bookmark-list-query-state";
import { replaceCurrentSearchTagToken, suggestSearchFieldTags } from "./search-tag-autocomplete";

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
const searchInput = ref<HTMLInputElement>();
const searchCursorPosition = ref(0);
const tagSuggestions = ref<TagSummaryDTO[]>([]);
const tagSuggestionsOpen = ref(false);
const activeTagSuggestionIndex = ref(0);
const searchTagListboxId = "bookmark-list-search-tag-suggestions";
const visibleTagSuggestions = computed(() =>
  suggestSearchFieldTags(tagSuggestions.value, searchText.value, searchCursorPosition.value),
);
const activeTagDescendantId = computed(() =>
  tagSuggestionsOpen.value && activeTagSuggestionIndex.value >= 0
    ? `${searchTagListboxId}-${visibleTagSuggestions.value[activeTagSuggestionIndex.value]?.id}`
    : undefined,
);
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
    const nextText = renderMiniQueryFromState(nextState);
    if (nextText !== searchText.value) {
      searchText.value = nextText;
    }
  },
  { immediate: true },
);

watch(visibleTagSuggestions, (nextSuggestions) => {
  if (nextSuggestions.length === 0) {
    tagSuggestionsOpen.value = false;
    activeTagSuggestionIndex.value = 0;
    return;
  }

  if (activeTagSuggestionIndex.value >= nextSuggestions.length) {
    activeTagSuggestionIndex.value = nextSuggestions.length - 1;
  }
});

watch(searchText, () => {
  syncSearchCursorPosition();
  tagSuggestionsOpen.value = visibleTagSuggestions.value.length > 0;
});

void (async () => {
  const tagsResult = await listTags();
  if (tagsResult.isOk) {
    tagSuggestions.value = tagsResult.value.tags;
  }
})();

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

function syncSearchCursorPosition(event?: Event) {
  const target = event?.target instanceof HTMLInputElement ? event.target : searchInput.value;
  searchCursorPosition.value = target?.selectionStart ?? searchText.value.length;
}

function selectTagSuggestion(index: number) {
  const suggestion = visibleTagSuggestions.value[index];
  if (!suggestion) {
    return;
  }

  const replacement = replaceCurrentSearchTagToken(
    searchText.value,
    searchCursorPosition.value,
    suggestion.name,
  );
  searchText.value = replacement.value;
  searchCursorPosition.value = replacement.cursor;
  activeTagSuggestionIndex.value = 0;
  tagSuggestionsOpen.value = false;

  searchInput.value?.focus();
  searchInput.value?.setSelectionRange(replacement.cursor, replacement.cursor);
}

function onSearchInput(event: Event) {
  syncSearchCursorPosition(event);
  tagSuggestionsOpen.value = visibleTagSuggestions.value.length > 0;
}

function onSearchKeydown(event: KeyboardEvent) {
  if (event.key === "ArrowDown" && visibleTagSuggestions.value.length > 0) {
    event.preventDefault();
    tagSuggestionsOpen.value = true;
    activeTagSuggestionIndex.value =
      (activeTagSuggestionIndex.value + 1) % visibleTagSuggestions.value.length;
    return;
  }

  if (
    event.key === "ArrowUp" &&
    tagSuggestionsOpen.value &&
    visibleTagSuggestions.value.length > 0
  ) {
    event.preventDefault();
    activeTagSuggestionIndex.value =
      (activeTagSuggestionIndex.value - 1 + visibleTagSuggestions.value.length) %
      visibleTagSuggestions.value.length;
    return;
  }

  if ((event.key === "Enter" || event.key === "Tab") && tagSuggestionsOpen.value) {
    const hasSuggestion = visibleTagSuggestions.value.length > 0;
    if (!hasSuggestion) return;
    event.preventDefault();
    selectTagSuggestion(activeTagSuggestionIndex.value);
    return;
  }

  if (event.key === "Escape" && tagSuggestionsOpen.value) {
    event.preventDefault();
    tagSuggestionsOpen.value = false;
  }
}

async function onTagClick(tagName: string) {
  const nextState = toggleIncludedTagFilter(queryState.value, tagName);
  await router.push({
    path: "/",
    query: toBookmarkListRouteQuery(nextState),
  });
}

async function onDomainClick(domain: string) {
  const nextState = toggleDomainFilter(queryState.value, domain);
  await router.push({
    path: "/",
    query: toBookmarkListRouteQuery(nextState),
  });
}
</script>

<template>
  <main class="ui-page-text min-h-screen px-4 py-8 sm:px-6">
    <section class="mx-auto max-w-3xl">
      <header class="mb-7 flex items-center justify-between gap-4">
        <div>
          <p class="ui-link text-xs font-bold tracking-normal uppercase">pongolinks</p>
          <h1 class="ui-text-strong mt-1 text-2xl font-bold select-none">Bookmarks</h1>
        </div>
        <RouterLink
          class="ui-action inline-flex min-h-10 items-center justify-center px-4 text-sm font-semibold transition select-none"
          to="/bookmarks/new"
        >
          New bookmark
        </RouterLink>
      </header>

      <p v-if="error" class="ui-danger-banner border-l-4 px-4 py-3 text-sm font-medium">
        {{ error }}
      </p>
      <p v-else-if="shouldShowLoadingMessage" class="ui-text-muted text-sm">Loading bookmarks...</p>

      <form class="mb-4 flex items-center gap-2" @submit.prevent="submitSearch">
        <div class="relative w-full">
          <input
            ref="searchInput"
            v-model="searchText"
            type="text"
            class="ui-border-subtle ui-surface min-h-10 w-full border px-3 text-sm"
            placeholder="Search: sqlite #vue -#old @example.com"
            aria-label="Search bookmarks"
            autocomplete="off"
            role="combobox"
            :aria-expanded="tagSuggestionsOpen"
            :aria-controls="searchTagListboxId"
            :aria-activedescendant="activeTagDescendantId"
            @input="onSearchInput"
            @click="syncSearchCursorPosition"
            @keyup="syncSearchCursorPosition"
            @focus="onSearchInput"
            @keydown="onSearchKeydown"
          />
          <ul
            v-if="tagSuggestionsOpen"
            :id="searchTagListboxId"
            class="ui-border-subtle ui-surface absolute z-20 mt-1 max-h-56 w-full overflow-auto border py-1 text-sm shadow-sm"
            role="listbox"
          >
            <li
              v-for="(tag, index) in visibleTagSuggestions"
              :id="`${searchTagListboxId}-${tag.id}`"
              :key="tag.id"
              class="cursor-pointer px-3 py-1.5"
              :class="
                index === activeTagSuggestionIndex
                  ? 'ui-page-text ui-surface-elevated'
                  : 'ui-text-muted hover:ui-page-text'
              "
              role="option"
              :aria-selected="index === activeTagSuggestionIndex"
              @mouseenter="activeTagSuggestionIndex = index"
              @mousedown.prevent="selectTagSuggestion(index)"
            >
              {{ tag.name }}
            </li>
          </ul>
        </div>
        <button class="ui-action min-h-10 px-4 text-sm font-semibold" type="submit">Search</button>
      </form>
      <div v-if="isSearchActive" class="mb-5">
        <button type="button" class="ui-muted-link text-sm font-semibold" @click="clearSearch">
          Clear search
        </button>
      </div>

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

      <footer class="ui-border-subtle mt-8 flex justify-end border-t pt-4">
        <RouterLink class="ui-muted-link text-sm font-semibold select-none" to="/tools">
          Tools
        </RouterLink>
      </footer>
    </section>
  </main>
</template>
