<script setup lang="ts">
import { onMounted, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";

import { getBookmark, updateBookmark } from "./api";
import BookmarkForm from "./BookmarkForm.vue";
import type { BookmarkDTO, EditableBookmarkPayload, FormErrors } from "./types";

const route = useRoute();
const router = useRouter();
const bookmark = ref<BookmarkDTO>();
const errors = ref<FormErrors>({});
const isLoading = ref(true);
const isSaving = ref(false);
const bookmarkId = String(route.params.id);

onMounted(async () => {
  const result = await getBookmark(bookmarkId);

  if (result.ok) {
    bookmark.value = result.data;
  } else {
    errors.value = result.errors;
  }

  isLoading.value = false;
});

async function saveBookmark(payload: EditableBookmarkPayload) {
  isSaving.value = true;
  errors.value = {};

  const result = await updateBookmark(bookmarkId, payload);

  if (result.ok) {
    await router.push("/");
  } else {
    errors.value = result.errors;
  }

  isSaving.value = false;
}
</script>

<template>
  <main class="min-h-screen bg-[#f7f8f5] px-4 py-8 text-slate-900 sm:px-6">
    <section class="mx-auto max-w-2xl">
      <RouterLink class="text-sm font-semibold text-emerald-800 hover:text-emerald-950" to="/">
        Back to bookmarks
      </RouterLink>
      <h1 class="mt-5 text-2xl font-bold text-slate-950">Edit bookmark</h1>
      <p v-if="isLoading" class="mt-6 text-sm text-slate-600">Loading bookmark...</p>
      <div v-else class="mt-6 border-y border-slate-200 bg-white py-6">
        <BookmarkForm
          :bookmark="bookmark"
          :errors="errors"
          :is-saving="isSaving"
          submit-label="Save changes"
          @submit="saveBookmark"
        />
      </div>
    </section>
  </main>
</template>
