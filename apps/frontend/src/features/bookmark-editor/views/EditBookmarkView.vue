<script setup lang="ts">
import { onMounted, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";

import type { FormErrors } from "#/shared/api/errors.ts";
import { listTags } from "#/features/tags/api.ts";
import type { TagSummaryDTO } from "#/features/tags/types.ts";
import type { BookmarkDTO, EditableBookmarkPayload } from "#/features/bookmarks/types.ts";
import { deleteBookmark, getBookmark, updateBookmark } from "#/features/bookmarks/api/api.ts";
import BookmarkForm from "../components/BookmarkForm/BookmarkForm.vue";

const route = useRoute();
const router = useRouter();
const bookmark = ref<BookmarkDTO>();
const errors = ref<FormErrors>({});
const isLoading = ref(true);
const isDeleting = ref(false);
const isSaving = ref(false);
const bookmarkId = String(route.params.id);
const tagSuggestions = ref<TagSummaryDTO[]>([]);

onMounted(async () => {
  const [bookmarkResult, tagsResult] = await Promise.all([getBookmark(bookmarkId), listTags()]);

  if (bookmarkResult.isOk) {
    bookmark.value = bookmarkResult.value;
  } else {
    errors.value = bookmarkResult.error.formErrors;
  }

  if (tagsResult.isOk) {
    tagSuggestions.value = tagsResult.value.tags;
  }

  isLoading.value = false;
});

async function saveBookmark(payload: EditableBookmarkPayload) {
  if (isSaving.value || isDeleting.value) {
    return;
  }

  isSaving.value = true;
  errors.value = {};

  const result = await updateBookmark(bookmarkId, payload);

  if (result.isOk) {
    await router.push("/");
  } else {
    errors.value = result.error.formErrors;
  }

  isSaving.value = false;
}

async function confirmDeleteBookmark() {
  if (isSaving.value || isDeleting.value) {
    return;
  }

  if (!window.confirm("Delete this bookmark? This action cannot be undone.")) {
    return;
  }

  isDeleting.value = true;
  errors.value = {};

  const result = await deleteBookmark(bookmarkId);

  if (result.isOk) {
    await router.push("/");
  } else {
    errors.value = result.error.formErrors;
  }

  isDeleting.value = false;
}
</script>

<template>
  <main class="ui-page-text min-h-screen px-4 py-8 sm:px-6">
    <section class="mx-auto max-w-3xl">
      <RouterLink class="ui-link text-sm font-semibold" to="/"> Back to bookmarks</RouterLink>
      <h1 class="ui-text-strong mt-5 text-2xl font-bold">Edit bookmark</h1>
      <p v-if="isLoading" class="ui-text-muted mt-6 text-sm">Loading bookmark...</p>
      <div v-else class="py-6">
        <BookmarkForm
          :bookmark="bookmark"
          :errors="errors"
          :is-deleting="isDeleting"
          :is-saving="isSaving"
          :tag-suggestions="tagSuggestions"
          show-delete
          submit-label="Save changes"
          @delete="confirmDeleteBookmark"
          @submit="saveBookmark"
        />
      </div>
    </section>
  </main>
</template>
