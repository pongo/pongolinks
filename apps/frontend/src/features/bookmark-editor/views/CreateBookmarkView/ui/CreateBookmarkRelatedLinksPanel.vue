<script setup lang="ts">
import { RouterLink } from "vue-router";

import type { CreateBookmarkState } from "../create-bookmark-flow.ts";

type RelatedLinksState = Extract<CreateBookmarkState, { kind: "related-link-matches" }>;

defineProps<{
  bookmarks: RelatedLinksState["bookmarks"];
}>();

const emit = defineEmits<{
  createAnyway: [];
}>();
</script>

<template>
  <div class="py-6">
    <div class="ui-border ui-surface border px-4 py-4">
      <p class="ui-text-emphasis text-sm font-semibold">Related links found in bookmarks</p>
      <ul class="mt-4 space-y-3">
        <li v-for="bookmark in bookmarks" :key="bookmark.id" class="ui-border-subtle border p-3">
          <RouterLink class="ui-link text-sm font-semibold" :to="`/bookmarks/${bookmark.id}/edit`">
            {{ bookmark.title }}
          </RouterLink>
          <p class="ui-text-muted mt-1 text-sm break-all">{{ bookmark.url }}</p>
        </li>
      </ul>
      <button
        class="ui-border ui-surface ui-suggestion-hover ui-text-emphasis mt-4 inline-flex min-h-10 items-center justify-center border px-4 text-sm font-semibold transition"
        type="button"
        @click="emit('createAnyway')"
      >
        Create a new bookmark anyway
      </button>
    </div>
  </div>
</template>
