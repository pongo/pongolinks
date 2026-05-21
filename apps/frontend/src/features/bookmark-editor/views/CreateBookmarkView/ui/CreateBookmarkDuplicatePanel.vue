<script setup lang="ts">
import { RouterLink } from "vue-router";

import type { CreateBookmarkState } from "../create-bookmark-flow.ts";

type DuplicateBookmarkState = Extract<CreateBookmarkState, { kind: "duplicate-bookmark" }>;

defineProps<{
  bookmark: DuplicateBookmarkState["bookmark"];
}>();

const emit = defineEmits<{
  createAnyway: [];
}>();
</script>

<template>
  <div class="py-6">
    <div class="ui-border ui-surface border px-4 py-4">
      <p class="ui-text-emphasis text-sm font-semibold">Possible duplicate bookmark</p>
      <p class="ui-text-muted mt-2 text-sm">
        A bookmark with the same URL and alternate HTTP protocol already exists.
      </p>
      <a
        class="ui-link mt-3 block text-sm font-semibold break-all"
        :href="bookmark.url"
        rel="noreferrer"
        target="_blank"
      >
        {{ bookmark.url }}
      </a>
      <div class="mt-4 flex flex-wrap gap-3">
        <RouterLink
          class="ui-action inline-flex min-h-10 items-center justify-center px-4 text-sm font-semibold transition"
          :to="bookmark.editHref"
        >
          Edit existing bookmark
        </RouterLink>
        <button
          class="ui-border ui-surface ui-suggestion-hover ui-text-emphasis inline-flex min-h-10 items-center justify-center border px-4 text-sm font-semibold transition"
          type="button"
          @click="emit('createAnyway')"
        >
          Create separate bookmark
        </button>
      </div>
    </div>
  </div>
</template>
