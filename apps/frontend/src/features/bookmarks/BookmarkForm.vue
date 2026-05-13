<script setup lang="ts">
import { computed, reactive, watch } from "vue";

import type { BookmarkDTO, EditableBookmarkPayload, FormErrors } from "./types";

const props = defineProps<{
  bookmark?: BookmarkDTO;
  errors?: FormErrors;
  isSaving: boolean;
  submitLabel: string;
}>();

const emit = defineEmits<{
  submit: [payload: EditableBookmarkPayload];
}>();

const form = reactive<EditableBookmarkPayload>({
  url: "",
  title: "",
  description: "",
  isPrivate: false,
});

watch(
  () => props.bookmark,
  (bookmark) => {
    form.url = bookmark?.url ?? "";
    form.title = bookmark?.title ?? "";
    form.description = bookmark?.description ?? "";
    form.isPrivate = bookmark?.isPrivate ?? false;
  },
  { immediate: true },
);

const formError = computed(() => props.errors?.form);

function submitForm() {
  emit("submit", {
    url: form.url,
    title: form.title,
    description: form.description,
    isPrivate: form.isPrivate,
  });
}
</script>

<template>
  <form class="space-y-5" @submit.prevent="submitForm">
    <p
      v-if="formError"
      class="border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
    >
      {{ formError }}
    </p>

    <label class="block">
      <span class="mb-2 block text-sm font-semibold text-slate-800">URL</span>
      <input
        v-model="form.url"
        class="w-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
        type="url"
        autocomplete="url"
        :aria-invalid="Boolean(errors?.url)"
        :aria-describedby="errors?.url ? 'bookmark-url-error' : undefined"
      />
      <span v-if="errors?.url" id="bookmark-url-error" class="mt-2 block text-sm text-red-700">
        {{ errors.url }}
      </span>
    </label>

    <label class="block">
      <span class="mb-2 block text-sm font-semibold text-slate-800">Title</span>
      <input
        v-model="form.title"
        class="w-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
        type="text"
        autocomplete="off"
        :aria-invalid="Boolean(errors?.title)"
        :aria-describedby="errors?.title ? 'bookmark-title-error' : undefined"
      />
      <span v-if="errors?.title" id="bookmark-title-error" class="mt-2 block text-sm text-red-700">
        {{ errors.title }}
      </span>
    </label>

    <label class="block">
      <span class="mb-2 block text-sm font-semibold text-slate-800">Description</span>
      <textarea
        v-model="form.description"
        class="min-h-28 w-full resize-y border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
        rows="4"
      />
    </label>

    <label class="flex items-center gap-3 text-sm font-semibold text-slate-800">
      <input v-model="form.isPrivate" class="size-4 accent-emerald-700" type="checkbox" />
      Private bookmark
    </label>

    <button
      class="inline-flex min-h-10 items-center justify-center bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      type="submit"
      :disabled="isSaving"
    >
      {{ isSaving ? "Saving..." : submitLabel }}
    </button>
  </form>
</template>
