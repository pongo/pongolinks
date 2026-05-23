import { nextTick, ref } from "vue";
import { describe, expect, it } from "vitest";

import { useLocalTagsPagination } from "./useLocalTagsPagination";

describe("useLocalTagsPagination", () => {
  it("calculates ranges and paginated items", () => {
    const items = ref([1, 2, 3, 4, 5]);
    const pagination = useLocalTagsPagination(items, 2);

    expect(pagination.totalPages.value).toBe(3);
    expect(pagination.pageRangeStart.value).toBe(1);
    expect(pagination.pageRangeEnd.value).toBe(2);
    expect(pagination.paginatedItems.value).toEqual([1, 2]);

    pagination.goToPage(3);

    expect(pagination.visiblePage.value).toBe(3);
    expect(pagination.pageRangeStart.value).toBe(5);
    expect(pagination.pageRangeEnd.value).toBe(5);
    expect(pagination.paginatedItems.value).toEqual([5]);
  });

  it("uses an empty range when there are no items", () => {
    const items = ref<number[]>([]);
    const pagination = useLocalTagsPagination(items, 2);

    expect(pagination.totalPages.value).toBe(1);
    expect(pagination.pageRangeStart.value).toBe(0);
    expect(pagination.pageRangeEnd.value).toBe(0);
    expect(pagination.paginatedItems.value).toEqual([]);
  });

  it("clamps the current page when total pages shrink", async () => {
    const items = ref([1, 2, 3, 4, 5]);
    const pagination = useLocalTagsPagination(items, 2);

    pagination.goToPage(3);
    items.value = [1, 2, 3];
    await nextTick();

    expect(pagination.currentPage.value).toBe(2);
    expect(pagination.visiblePage.value).toBe(2);
    expect(pagination.paginatedItems.value).toEqual([3]);
  });

  it("resets to the first page", () => {
    const items = ref([1, 2, 3, 4, 5]);
    const pagination = useLocalTagsPagination(items, 2);

    pagination.goToPage(3);
    pagination.resetPage();

    expect(pagination.currentPage.value).toBe(1);
    expect(pagination.visiblePage.value).toBe(1);
  });
});
