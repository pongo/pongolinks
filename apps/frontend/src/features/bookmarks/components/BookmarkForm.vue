<script setup lang="ts">
import { computed, reactive, watch } from "vue";

import type { FormErrors } from "#/shared/api/errors.ts";
import type { TagSummaryDTO } from "#/features/tags/types.ts";
import type { BookmarkDTO, EditableBookmarkPayload } from "../types";
import BookmarkTagInput from "./BookmarkTagInput/BookmarkTagInput.vue";

const props = defineProps<{
  bookmark?: BookmarkDTO;
  errors?: FormErrors;
  isDeleting?: boolean;
  isSaving: boolean;
  showDelete?: boolean;
  submitLabel: string;
  tagSuggestions?: TagSummaryDTO[];
}>();

const emit = defineEmits<{
  delete: [];
  submit: [payload: EditableBookmarkPayload];
}>();

const form = reactive<EditableBookmarkPayload>({
  url: "",
  title: "",
  description: "",
  isPrivate: false,
  tagsText: "",
});

watch(
  () => props.bookmark,
  (bookmark) => {
    form.url = bookmark?.url ?? "";
    form.title = bookmark?.title ?? "";
    form.description = bookmark?.description ?? "";
    form.isPrivate = bookmark?.isPrivate ?? false;
    const tagsText = bookmark?.tags.map((tag) => tag.name).join(" ") ?? "";
    form.tagsText = tagsText ? `${tagsText} ` : "";
  },
  { immediate: true },
);

const formError = computed(() => props.errors?.form);
const isPending = computed(() => props.isSaving || props.isDeleting);

function submitForm() {
  if (isPending.value) {
    return;
  }

  emit("submit", {
    url: form.url,
    title: form.title,
    description: form.description,
    isPrivate: form.isPrivate,
    tagsText: form.tagsText,
  });
}

function deleteBookmark() {
  if (isPending.value) {
    return;
  }

  emit("delete");
}
</script>

<template>
  <form class="space-y-5" @submit.prevent="submitForm">
    <p v-if="formError" class="ui-danger-banner border-l-4 px-4 py-3 text-sm font-medium">
      {{ formError }}
    </p>

    <label class="block">
      <span class="ui-text-emphasis mb-2 block text-sm font-semibold">URL</span>
      <input
        v-model="form.url"
        class="ui-field w-full border px-3 py-2 text-sm transition outline-none focus:ring-2"
        type="url"
        autocomplete="url"
        :aria-invalid="Boolean(errors?.url)"
        :aria-describedby="errors?.url ? 'bookmark-url-error' : undefined"
      />
      <span v-if="errors?.url" id="bookmark-url-error" class="ui-danger-text mt-2 block text-sm">
        {{ errors.url }}
      </span>
    </label>

    <label class="block">
      <span class="ui-text-emphasis mb-2 block text-sm font-semibold">Title</span>
      <input
        v-model="form.title"
        class="ui-field w-full border px-3 py-2 text-sm transition outline-none focus:ring-2"
        type="text"
        autocomplete="off"
        :aria-invalid="Boolean(errors?.title)"
        :aria-describedby="errors?.title ? 'bookmark-title-error' : undefined"
      />
      <span
        v-if="errors?.title"
        id="bookmark-title-error"
        class="ui-danger-text mt-2 block text-sm"
      >
        {{ errors.title }}
      </span>
    </label>

    <label class="block">
      <span class="ui-text-emphasis mb-2 block text-sm font-semibold">Description</span>
      <textarea
        v-model="form.description"
        class="ui-field field-sizing-content min-h-28 w-full resize-y border px-3 py-2 text-sm transition outline-none focus:ring-2"
        rows="4"
      />
    </label>

    <BookmarkTagInput v-model="form.tagsText" :tag-suggestions="tagSuggestions" />

    <label class="ui-text-emphasis flex items-center gap-3 text-sm font-semibold">
      <input v-model="form.isPrivate" class="ui-checkbox-accent size-4" type="checkbox" />
      Private bookmark
    </label>

    <div class="flex items-center justify-between gap-3">
      <button
        class="ui-action inline-flex min-h-10 items-center justify-center px-4 text-sm font-semibold transition disabled:cursor-not-allowed"
        type="submit"
        :disabled="isPending"
      >
        {{ isSaving ? "Saving..." : submitLabel }}
      </button>

      <button
        v-if="showDelete"
        class="ui-danger-action inline-flex min-h-10 items-center justify-center px-4 text-sm font-semibold transition disabled:cursor-not-allowed"
        type="button"
        :disabled="isPending"
        @click="deleteBookmark"
      >
        {{ isDeleting ? "Deleting..." : "Delete" }}
      </button>
    </div>
  </form>
</template>
