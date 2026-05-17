<script setup lang="ts">
import { computed, ref, watch } from "vue";

import { listTags } from "#/features/tags/api.ts";
import type { TagSummaryDTO } from "#/features/tags/types.ts";
import { replaceCurrentSearchTagToken, suggestSearchFieldTags } from "./search-tag-autocomplete";

const props = defineProps<{
  modelValue: string;
  isSearchActive: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
  submit: [];
  clear: [];
}>();

const searchInput = ref<HTMLInputElement>();
const searchCursorPosition = ref(0);
const tagSuggestions = ref<TagSummaryDTO[]>([]);
const tagSuggestionsOpen = ref(false);
const activeTagSuggestionIndex = ref(0);
const searchTagListboxId = "bookmark-list-search-tag-suggestions";
const visibleTagSuggestions = computed(() =>
  suggestSearchFieldTags(tagSuggestions.value, props.modelValue, searchCursorPosition.value),
);
const activeTagDescendantId = computed(() =>
  tagSuggestionsOpen.value && activeTagSuggestionIndex.value >= 0
    ? `${searchTagListboxId}-${visibleTagSuggestions.value[activeTagSuggestionIndex.value]?.id}`
    : undefined,
);

watch(visibleTagSuggestions, (nextSuggestions) => {
  if (nextSuggestions.length === 0) {
    tagSuggestionsOpen.value = false;
    activeTagSuggestionIndex.value = 0;
    return;
  }

  if (activeTagSuggestionIndex.value >= nextSuggestions.length) {
    activeTagSuggestionIndex.value = nextSuggestions.length - 1;
  }
});

watch(
  () => props.modelValue,
  () => {
    syncSearchCursorPosition();
    tagSuggestionsOpen.value = visibleTagSuggestions.value.length > 0;
  },
);

void (async () => {
  const tagsResult = await listTags();
  if (tagsResult.isOk) {
    tagSuggestions.value = tagsResult.value.tags;
  }
})();

function syncSearchCursorPosition(event?: Event) {
  const target = event?.target instanceof HTMLInputElement ? event.target : searchInput.value;
  searchCursorPosition.value = target?.selectionStart ?? props.modelValue.length;
}

function selectTagSuggestion(index: number) {
  const suggestion = visibleTagSuggestions.value[index];
  if (!suggestion) {
    return;
  }

  const replacement = replaceCurrentSearchTagToken(
    props.modelValue,
    searchCursorPosition.value,
    suggestion.name,
  );
  emit("update:modelValue", replacement.value);
  searchCursorPosition.value = replacement.cursor;
  activeTagSuggestionIndex.value = 0;
  tagSuggestionsOpen.value = false;

  searchInput.value?.focus();
  searchInput.value?.setSelectionRange(replacement.cursor, replacement.cursor);
}

function onSearchInput(event: Event) {
  const target = event.target;
  if (target instanceof HTMLInputElement) {
    emit("update:modelValue", target.value);
  }
  syncSearchCursorPosition(event);
  tagSuggestionsOpen.value = visibleTagSuggestions.value.length > 0;
}

function onSearchKeydown(event: KeyboardEvent) {
  if (event.key === "ArrowDown" && visibleTagSuggestions.value.length > 0) {
    event.preventDefault();
    tagSuggestionsOpen.value = true;
    activeTagSuggestionIndex.value =
      (activeTagSuggestionIndex.value + 1) % visibleTagSuggestions.value.length;
    return;
  }

  if (
    event.key === "ArrowUp" &&
    tagSuggestionsOpen.value &&
    visibleTagSuggestions.value.length > 0
  ) {
    event.preventDefault();
    activeTagSuggestionIndex.value =
      (activeTagSuggestionIndex.value - 1 + visibleTagSuggestions.value.length) %
      visibleTagSuggestions.value.length;
    return;
  }

  if ((event.key === "Enter" || event.key === "Tab") && tagSuggestionsOpen.value) {
    const hasSuggestion = visibleTagSuggestions.value.length > 0;
    if (!hasSuggestion) return;
    event.preventDefault();
    selectTagSuggestion(activeTagSuggestionIndex.value);
    return;
  }

  if (event.key === "Escape" && tagSuggestionsOpen.value) {
    event.preventDefault();
    tagSuggestionsOpen.value = false;
  }
}
</script>

<template>
  <form class="mb-4 flex items-center gap-2" @submit.prevent="emit('submit')">
    <div class="relative w-full">
      <input
        ref="searchInput"
        :value="modelValue"
        type="text"
        class="ui-border-subtle ui-surface min-h-10 w-full border px-3 text-sm"
        placeholder="Search: sqlite #vue -#old @example.com"
        aria-label="Search bookmarks"
        autocomplete="off"
        role="combobox"
        :aria-expanded="tagSuggestionsOpen"
        :aria-controls="searchTagListboxId"
        :aria-activedescendant="activeTagDescendantId"
        @input="onSearchInput"
        @click="syncSearchCursorPosition"
        @keyup="syncSearchCursorPosition"
        @focus="onSearchInput"
        @keydown="onSearchKeydown"
      />
      <ul
        v-if="tagSuggestionsOpen"
        :id="searchTagListboxId"
        class="ui-border-subtle ui-surface absolute z-20 mt-1 max-h-56 w-full overflow-auto border py-1 text-sm shadow-sm"
        role="listbox"
      >
        <li
          v-for="(tag, index) in visibleTagSuggestions"
          :id="`${searchTagListboxId}-${tag.id}`"
          :key="tag.id"
          class="cursor-pointer px-3 py-1.5"
          :class="
            index === activeTagSuggestionIndex
              ? 'ui-page-text ui-surface-elevated'
              : 'ui-text-muted hover:ui-page-text'
          "
          role="option"
          :aria-selected="index === activeTagSuggestionIndex"
          @mouseenter="activeTagSuggestionIndex = index"
          @mousedown.prevent="selectTagSuggestion(index)"
        >
          {{ tag.name }}
        </li>
      </ul>
    </div>
    <button class="ui-action min-h-10 px-4 text-sm font-semibold" type="submit">Search</button>
  </form>
  <div v-if="isSearchActive" class="mb-5">
    <button type="button" class="ui-muted-link text-sm font-semibold" @click="emit('clear')">
      Clear search
    </button>
  </div>
</template>
