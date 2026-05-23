import { computed, ref, watch } from "vue";
import type { ComputedRef, Ref } from "vue";

type PaginationItems<T> = Ref<readonly T[]> | ComputedRef<readonly T[]>;

export function useLocalTagsPagination<T>(items: PaginationItems<T>, pageSize: number) {
  if (pageSize < 1) {
    throw new RangeError("pageSize must be at least 1");
  }

  const currentPage = ref(1);

  const totalPages = computed(() => Math.max(1, Math.ceil(items.value.length / pageSize)));
  const visiblePage = computed(() => Math.min(currentPage.value, totalPages.value));
  const paginatedItems = computed(() => {
    const start = (visiblePage.value - 1) * pageSize;
    return items.value.slice(start, start + pageSize);
  });
  const pageRangeStart = computed(() => {
    if (items.value.length === 0) {
      return 0;
    }

    return (visiblePage.value - 1) * pageSize + 1;
  });
  const pageRangeEnd = computed(() => Math.min(visiblePage.value * pageSize, items.value.length));
  const hasPreviousPage = computed(() => visiblePage.value > 1);
  const hasNextPage = computed(() => visiblePage.value < totalPages.value);

  watch(totalPages, (nextTotalPages) => {
    if (currentPage.value > nextTotalPages) {
      currentPage.value = nextTotalPages;
    }
  });

  function goToPage(page: number) {
    currentPage.value = Math.max(1, Math.min(page, totalPages.value));
  }

  function resetPage() {
    currentPage.value = 1;
  }

  return {
    currentPage,
    visiblePage,
    totalPages,
    paginatedItems,
    pageRangeStart,
    pageRangeEnd,
    hasPreviousPage,
    hasNextPage,
    goToPage,
    resetPage,
  };
}
