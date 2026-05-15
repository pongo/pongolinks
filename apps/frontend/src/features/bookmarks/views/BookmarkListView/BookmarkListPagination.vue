<script setup lang="ts">
import { ChevronLeftIcon, ChevronRightIcon } from "@lucide/vue";
import { computed } from "vue";
import { RouterLink, type RouteLocationRaw } from "vue-router";

import type { BookmarkListPagination } from "../../types";
import { createPaginationWindow, type PaginationWindowItem } from "./pagination-window";

const props = defineProps<{
  pagination: BookmarkListPagination;
}>();

const paginationItems = computed(() =>
  createPaginationWindow({
    page: props.pagination.page,
    totalPages: props.pagination.totalPages,
  }),
);

function bookmarkListRoute(page: number): RouteLocationRaw {
  return page <= 1 ? "/" : { path: "/", query: { page: String(page) } };
}

function previousPageRoute(): RouteLocationRaw {
  return bookmarkListRoute(Math.max(1, props.pagination.page - 1));
}

function nextPageRoute(): RouteLocationRaw {
  return bookmarkListRoute(props.pagination.page + 1);
}

function paginationItemKey(item: PaginationWindowItem) {
  return item.type === "page" ? `page-${item.page}` : `ellipsis-${item.key}`;
}
</script>

<template>
  <div class="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <p class="ui-text-muted text-sm">
      {{ pagination.totalCount }}
      {{ pagination.totalCount === 1 ? "bookmark" : "bookmarks" }}
    </p>

    <nav
      v-if="pagination.totalPages > 1"
      class="flex items-center gap-1"
      aria-label="Bookmark pages"
    >
      <RouterLink
        v-if="pagination.hasPreviousPage"
        class="ui-muted-link inline-flex size-9 items-center justify-center border text-sm font-semibold"
        :to="previousPageRoute()"
        aria-label="Previous page"
      >
        <ChevronLeftIcon class="size-4" aria-hidden="true" />
      </RouterLink>

      <template v-for="item in paginationItems" :key="paginationItemKey(item)">
        <RouterLink
          v-if="item.type === 'page'"
          class="inline-flex size-9 items-center justify-center border text-sm font-semibold transition"
          :class="item.page === pagination.page ? 'ui-action' : 'ui-muted-link ui-border-subtle'"
          :to="bookmarkListRoute(item.page)"
          :aria-current="item.page === pagination.page ? 'page' : undefined"
        >
          {{ item.page }}
        </RouterLink>
        <span v-else class="ui-text-muted inline-flex size-9 items-center justify-center">
          ...
        </span>
      </template>

      <RouterLink
        v-if="pagination.hasNextPage"
        class="ui-muted-link inline-flex size-9 items-center justify-center border text-sm font-semibold"
        :to="nextPageRoute()"
        aria-label="Next page"
      >
        <ChevronRightIcon class="size-4" aria-hidden="true" />
      </RouterLink>
    </nav>
  </div>
</template>
