<script setup lang="ts">
import { ref } from "vue";
import { RouterLink, useRouter } from "vue-router";

import { createBookmark } from "./api";
import BookmarkForm from "./BookmarkForm.vue";
import type { EditableBookmarkPayload, FormErrors } from "./types";

const router = useRouter();
const errors = ref<FormErrors>({});
const isSaving = ref(false);

async function saveBookmark(payload: EditableBookmarkPayload) {
  isSaving.value = true;
  errors.value = {};

  const result = await createBookmark(payload);

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
      <h1 class="mt-5 text-2xl font-bold text-slate-950">New bookmark</h1>
      <div class="mt-6 border-y border-slate-200 bg-white py-6">
        <BookmarkForm
          :errors="errors"
          :is-saving="isSaving"
          submit-label="Create bookmark"
          @submit="saveBookmark"
        />
      </div>
    </section>
  </main>
</template>
