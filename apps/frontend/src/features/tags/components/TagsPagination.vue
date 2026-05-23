<script setup lang="ts">
import { ChevronLeftIcon, ChevronRightIcon } from "@lucide/vue";
import { computed } from "vue";

import { createPaginationWindow, type PaginationWindowItem } from "#/shared/pagination-window.ts";

const props = defineProps<{
  page: number;
  totalPages: number;
  totalCount: number;
  rangeStart: number;
  rangeEnd: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}>();

const emit = defineEmits<{
  "page-change": [page: number];
}>();

const paginationItems = computed(() =>
  createPaginationWindow({
    page: props.page,
    totalPages: props.totalPages,
  }),
);

function paginationItemKey(item: PaginationWindowItem) {
  return item.type === "page" ? `page-${item.page}` : `ellipsis-${item.key}`;
}
</script>

<template>
  <div class="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <p class="ui-text-muted text-sm">
      Showing {{ rangeStart }}-{{ rangeEnd }} of {{ totalCount }}
      {{ totalCount === 1 ? "tag" : "tags" }}
    </p>

    <nav v-if="totalPages > 1" class="flex items-center gap-1 select-none" aria-label="Tag pages">
      <button
        v-if="hasPreviousPage"
        class="ui-muted-link ui-border-subtle inline-flex size-9 items-center justify-center border text-sm font-semibold"
        type="button"
        aria-label="Previous page"
        @click="emit('page-change', page - 1)"
      >
        <ChevronLeftIcon class="size-4" aria-hidden="true" />
      </button>

      <template v-for="item in paginationItems" :key="paginationItemKey(item)">
        <button
          v-if="item.type === 'page'"
          class="inline-flex size-9 items-center justify-center border text-sm font-semibold transition"
          :class="item.page === page ? 'ui-action' : 'ui-muted-link ui-border-subtle'"
          type="button"
          :aria-current="item.page === page ? 'page' : undefined"
          @click="emit('page-change', item.page)"
        >
          {{ item.page }}
        </button>
        <span v-else class="ui-text-muted inline-flex size-9 items-center justify-center">
          &hellip;
        </span>
      </template>

      <button
        v-if="hasNextPage"
        class="ui-muted-link ui-border-subtle inline-flex size-9 items-center justify-center border text-sm font-semibold"
        type="button"
        aria-label="Next page"
        @click="emit('page-change', page + 1)"
      >
        <ChevronRightIcon class="size-4" aria-hidden="true" />
      </button>
    </nav>
  </div>
</template>
