<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from "vue";

import type { FormErrors } from "#/shared/api/errors.ts";
import type { TagSummaryDTO } from "../tags/types";
import { replaceCurrentTagToken, suggestTags } from "./tag-autocomplete";
import type { BookmarkDTO, EditableBookmarkPayload } from "./types";

const props = defineProps<{
  bookmark?: BookmarkDTO;
  errors?: FormErrors;
  isSaving: boolean;
  submitLabel: string;
  tagSuggestions?: TagSummaryDTO[];
}>();

const emit = defineEmits<{
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
const tagsInput = ref<HTMLInputElement>();
const tagSuggestionsOpen = ref(false);
const activeTagSuggestionIndex = ref(-1);
const tagCursorPosition = ref(0);
const tagListboxId = "bookmark-tag-suggestions";
const visibleTagSuggestions = computed(() =>
  suggestTags(props.tagSuggestions ?? [], form.tagsText, tagCursorPosition.value),
);
const activeTagSuggestionId = computed(() =>
  tagSuggestionsOpen.value && activeTagSuggestionIndex.value >= 0
    ? `${tagListboxId}-${visibleTagSuggestions.value[activeTagSuggestionIndex.value]?.id}`
    : undefined,
);

watch(visibleTagSuggestions, (suggestions) => {
  if (suggestions.length === 0) {
    tagSuggestionsOpen.value = false;
    activeTagSuggestionIndex.value = -1;
    return;
  }

  if (activeTagSuggestionIndex.value >= suggestions.length) {
    activeTagSuggestionIndex.value = suggestions.length - 1;
  }
});

function updateTagCursor(event?: Event) {
  const target = event?.target instanceof HTMLInputElement ? event.target : tagsInput.value;
  tagCursorPosition.value = target?.selectionStart ?? form.tagsText.length;
}

function openTagSuggestions() {
  tagSuggestionsOpen.value = visibleTagSuggestions.value.length > 0;
}

function closeTagSuggestions() {
  tagSuggestionsOpen.value = false;
  activeTagSuggestionIndex.value = -1;
}

function updateTagSuggestions(event: Event) {
  updateTagCursor(event);
  activeTagSuggestionIndex.value = -1;
  openTagSuggestions();
}

async function selectTagSuggestion(index: number) {
  const tag = visibleTagSuggestions.value[index];
  if (!tag) {
    return;
  }

  const replacement = replaceCurrentTagToken(form.tagsText, tagCursorPosition.value, tag.name);
  form.tagsText = replacement.value;
  tagCursorPosition.value = replacement.cursor;
  closeTagSuggestions();

  await nextTick();
  tagsInput.value?.focus();
  tagsInput.value?.setSelectionRange(replacement.cursor, replacement.cursor);
}

function moveActiveTagSuggestion(offset: number) {
  const count = visibleTagSuggestions.value.length;
  if (count === 0) {
    return;
  }

  tagSuggestionsOpen.value = true;
  activeTagSuggestionIndex.value =
    activeTagSuggestionIndex.value < 0
      ? offset > 0
        ? 0
        : count - 1
      : (activeTagSuggestionIndex.value + offset + count) % count;
}

function handleTagKeydown(event: KeyboardEvent) {
  updateTagCursor(event);

  if (event.key === "ArrowDown") {
    if (visibleTagSuggestions.value.length === 0) {
      return;
    }

    event.preventDefault();
    moveActiveTagSuggestion(1);
    return;
  }

  if (event.key === "ArrowUp" && tagSuggestionsOpen.value) {
    event.preventDefault();
    moveActiveTagSuggestion(-1);
    return;
  }

  if ((event.key === "Enter" || event.key === "Tab") && tagSuggestionsOpen.value) {
    event.preventDefault();
    void selectTagSuggestion(
      activeTagSuggestionIndex.value >= 0 ? activeTagSuggestionIndex.value : 0,
    );
    return;
  }

  if (event.key === "Escape" && tagSuggestionsOpen.value) {
    event.preventDefault();
    closeTagSuggestions();
    return;
  }

  if (event.key === " ") {
    closeTagSuggestions();
  }
}

function submitForm() {
  emit("submit", {
    url: form.url,
    title: form.title,
    description: form.description,
    isPrivate: form.isPrivate,
    tagsText: form.tagsText,
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
        class="w-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 transition outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
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
        class="w-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 transition outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
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
        class="min-h-28 w-full resize-y border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 transition outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
        rows="4"
      />
    </label>

    <label class="block">
      <span class="mb-2 block text-sm font-semibold text-slate-800">Tags</span>
      <div class="relative">
        <input
          ref="tagsInput"
          v-model="form.tagsText"
          class="w-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 transition outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          type="text"
          autocomplete="off"
          placeholder="article lang-ru learning"
          role="combobox"
          :aria-expanded="tagSuggestionsOpen"
          :aria-controls="tagListboxId"
          :aria-activedescendant="activeTagSuggestionId"
          @input="updateTagSuggestions"
          @click="updateTagSuggestions"
          @keyup="updateTagCursor"
          @keydown="handleTagKeydown"
          @blur="closeTagSuggestions"
        />
        <ul
          v-if="tagSuggestionsOpen"
          :id="tagListboxId"
          class="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto border border-slate-200 bg-white py-1 shadow-sm"
          role="listbox"
        >
          <li
            v-for="(tag, index) in visibleTagSuggestions"
            :id="`${tagListboxId}-${tag.id}`"
            :key="tag.id"
            class="cursor-pointer px-3 py-2 text-sm text-slate-800"
            :class="
              index === activeTagSuggestionIndex ? 'bg-blue-50 text-blue-950' : 'hover:bg-slate-50'
            "
            role="option"
            :aria-selected="index === activeTagSuggestionIndex"
            @mousedown.prevent="selectTagSuggestion(index)"
          >
            {{ tag.name }}
          </li>
        </ul>
      </div>
      <span class="mt-2 block text-sm text-slate-600">Separate tags with spaces.</span>
    </label>

    <label class="flex items-center gap-3 text-sm font-semibold text-slate-800">
      <input v-model="form.isPrivate" class="size-4 accent-blue-700" type="checkbox" />
      Private bookmark
    </label>

    <button
      class="inline-flex min-h-10 items-center justify-center bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      type="submit"
      :disabled="isSaving"
    >
      {{ isSaving ? "Saving..." : submitLabel }}
    </button>
  </form>
</template>
