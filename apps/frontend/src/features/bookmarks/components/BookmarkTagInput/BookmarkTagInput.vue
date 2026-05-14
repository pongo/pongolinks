<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";

import type { TagSummaryDTO } from "../../../tags/types";
import { replaceCurrentTagToken, suggestTags } from "./tag-autocomplete";

const props = defineProps<{
  modelValue: string;
  tagSuggestions?: TagSummaryDTO[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const tagsInput = ref<HTMLInputElement>();
const tagsTextValue = ref(props.modelValue);
const tagSuggestionsOpen = ref(false);
const activeTagSuggestionIndex = ref(-1);
const tagCursorPosition = ref(0);
const tagListboxId = "bookmark-tag-suggestions";
const tagsText = computed({
  get: () => tagsTextValue.value,
  set: (value: string) => {
    tagsTextValue.value = value;
    emit("update:modelValue", value);
  },
});
const visibleTagSuggestions = computed(() =>
  suggestTags(props.tagSuggestions ?? [], tagsTextValue.value, tagCursorPosition.value),
);
const activeTagSuggestionId = computed(() =>
  tagSuggestionsOpen.value && activeTagSuggestionIndex.value >= 0
    ? `${tagListboxId}-${visibleTagSuggestions.value[activeTagSuggestionIndex.value]?.id}`
    : undefined,
);

watch(
  () => props.modelValue,
  (value) => {
    if (value !== tagsTextValue.value) {
      tagsTextValue.value = value;
    }
  },
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
  tagCursorPosition.value = target?.selectionStart ?? tagsTextValue.value.length;
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

  const replacement = replaceCurrentTagToken(
    tagsTextValue.value,
    tagCursorPosition.value,
    tag.name,
  );
  tagsText.value = replacement.value;
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
</script>

<template>
  <label class="block">
    <span class="mb-2 block text-sm font-semibold text-slate-800">Tags</span>
    <div class="relative">
      <input
        ref="tagsInput"
        v-model="tagsText"
        class="w-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 transition outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
        type="text"
        autocomplete="off"
        placeholder=""
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
    <span hidden class="mt-2 block text-sm text-slate-600">Separate tags with spaces.</span>
  </label>
</template>
