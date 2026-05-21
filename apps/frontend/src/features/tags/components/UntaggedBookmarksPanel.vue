<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";

import { listUntaggedBookmarks } from "../api";
import type { UntaggedBookmarkDTO } from "../types";

const untaggedTotalCount = ref(-1);
const untaggedBookmarks = ref<UntaggedBookmarkDTO[]>([]);
const isVisible = ref(false);
const isLoading = ref(true);
const error = ref("");

const isTruncated = computed(() => untaggedTotalCount.value > untaggedBookmarks.value.length);
const shouldShowButtonVisible = computed(
  () => !isLoading.value && untaggedBookmarks.value.length > 0 && !isVisible.value,
);

onMounted(async () => {
  await loadUntaggedBookmarks();
});

async function loadUntaggedBookmarks() {
  isLoading.value = true;
  error.value = "";

  const result = await listUntaggedBookmarks();

  if (result.isErr) {
    error.value = result.error.formErrors.form ?? result.error.message;
  } else {
    untaggedTotalCount.value = result.value.totalCount;
    untaggedBookmarks.value = result.value.bookmarks;
  }

  isLoading.value = false;
}
</script>

<template>
  <section class="ui-border ui-surface mb-6 border px-5 py-5">
    <p v-if="error" class="ui-danger-banner mb-4 border-l-4 px-4 py-3 text-sm font-medium">
      {{ error }}
    </p>

    <div class="flex items-center justify-between gap-3">
      <div>
        <h2 class="ui-text-strong text-lg font-semibold">Untagged bookmarks</h2>
        <p class="ui-text-muted mt-1 text-sm">
          <span v-if="isLoading">Loading untagged bookmarks...</span>
          <span v-else>{{ untaggedTotalCount }} bookmarks without tags</span>
        </p>
      </div>
      <button
        class="ui-action inline-flex min-h-10 items-center justify-center px-4 text-sm font-semibold transition"
        type="button"
        @click="isVisible = true"
        v-if="shouldShowButtonVisible"
      >
        Show
      </button>
    </div>

    <div v-if="isVisible" class="mt-4">
      <p v-if="untaggedTotalCount === 0" class="ui-text-muted text-sm">No untagged bookmarks.</p>
      <ul v-else class="ui-border-subtle">
        <li v-for="bookmark in untaggedBookmarks" :key="bookmark.id" class="py-2">
          <RouterLink class="ui-link text-sm font-semibold" :to="`/bookmarks/${bookmark.id}/edit`">
            {{ bookmark.title }}
          </RouterLink>
        </li>
      </ul>
      <p v-if="isTruncated" class="ui-text-muted mt-2 text-xs">
        Showing only the first 100 bookmarks.
      </p>
    </div>
  </section>
</template>
