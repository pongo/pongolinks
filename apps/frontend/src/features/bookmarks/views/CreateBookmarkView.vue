<script setup lang="ts">
import { onMounted, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";

import type { FormErrors } from "#/shared/api/errors.ts";
import { listTags } from "../../tags/api";
import type { TagSummaryDTO } from "../../tags/types";
import { createBookmark } from "../api/api";
import BookmarkForm from "../components/BookmarkForm.vue";
import type { EditableBookmarkPayload } from "../types";

const router = useRouter();
const errors = ref<FormErrors>({});
const isSaving = ref(false);
const tagSuggestions = ref<TagSummaryDTO[]>([]);

onMounted(async () => {
  const result = await listTags();

  if (result.isOk) {
    tagSuggestions.value = result.value.tags;
  }
});

async function saveBookmark(payload: EditableBookmarkPayload) {
  isSaving.value = true;
  errors.value = {};

  const result = await createBookmark(payload);

  if (result.isOk) {
    await router.push("/");
  } else {
    errors.value = result.error.formErrors;
  }

  isSaving.value = false;
}
</script>

<template>
  <main class="min-h-screen px-4 py-8 text-slate-900 sm:px-6">
    <section class="mx-auto max-w-3xl">
      <RouterLink class="text-sm font-semibold text-blue-800 hover:text-blue-950" to="/">
        Back to bookmarks
      </RouterLink>
      <h1 class="mt-5 text-2xl font-bold text-slate-950">New bookmark</h1>
      <div class="py-6">
        <BookmarkForm
          :errors="errors"
          :is-saving="isSaving"
          :tag-suggestions="tagSuggestions"
          submit-label="Create bookmark"
          @submit="saveBookmark"
        />
      </div>
    </section>
  </main>
</template>
