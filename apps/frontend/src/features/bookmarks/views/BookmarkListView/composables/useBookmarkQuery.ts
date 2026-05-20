import { ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  isFilterActive,
  parseBookmarkListRouteQuery,
  parseMiniQueryToState,
  renderMiniQueryForContinuedInput,
  toggleDomainFilter,
  toggleIncludedTagFilter,
  toBookmarkListRouteQuery,
  type BookmarkListRouteState,
} from "../../../utils/bookmark-list-query-state.ts";

export function useBookmarkQuery() {
  const route = useRoute();
  const router = useRouter();

  // Reactive state derived from URL
  const queryState = computed(() => parseBookmarkListRouteQuery(route.query));

  // Local state for the search input
  const searchText = ref("");

  // Computed flag to determine if any search filters are currently applied
  const isSearchActive = computed(() => isFilterActive(queryState.value));

  // Sync the URL query state to the local search input field
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

  // Parse the search text and push the new state to the router
  async function submitSearch() {
    const next = parseMiniQueryToState(searchText.value);
    await router.push({
      path: "/",
      query: toBookmarkListRouteQuery({
        ...next,
        page: 1, // Reset to first page on new search
      }),
    });
  }

  // Clear the search input and reset the route
  async function clearSearch() {
    searchText.value = "";
    await router.push("/");
  }

  // Helper method to push new state and update the input text
  async function applyQueryState(nextState: BookmarkListRouteState) {
    await router.push({
      path: "/",
      query: toBookmarkListRouteQuery(nextState),
    });

    searchText.value = renderMiniQueryForContinuedInput(nextState);
  }

  // Toggle a specific tag filter
  async function onTagClick(tagName: string) {
    await applyQueryState(toggleIncludedTagFilter(queryState.value, tagName));
  }

  // Toggle a specific domain filter
  async function onDomainClick(domain: string) {
    await applyQueryState(toggleDomainFilter(queryState.value, domain));
  }

  return {
    queryState,
    searchText,
    isSearchActive,
    submitSearch,
    clearSearch,
    applyQueryState,
    onTagClick,
    onDomainClick,
  };
}
