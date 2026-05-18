<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { X } from "@lucide/vue";

import { listTags } from "#/features/tags/api.ts";
import type { TagSummaryDTO } from "#/features/tags/types.ts";
import { useTagAutocompleteInteraction } from "../../../components/autocomplete/useTagAutocompleteInteraction.ts";
import { replaceCurrentSearchTagToken, suggestSearchFieldTags } from "./search-tag-autocomplete.ts";

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
const searchTagListboxId = "bookmark-list-search-tag-suggestions";
const visibleTagSuggestions = computed(() =>
  suggestSearchFieldTags(tagSuggestions.value, props.modelValue, searchCursorPosition.value),
);
const tagSuggestionCount = computed(() => visibleTagSuggestions.value.length);
const {
  activeDescendantId: activeTagDescendantId,
  activeIndex: activeTagSuggestionIndex,
  close: closeTagSuggestions,
  isOpen: tagSuggestionsOpen,
  moveActive: moveActiveTagSuggestion,
  resetActive: resetActiveTagSuggestion,
  selectableIndex: selectableTagSuggestionIndex,
} = useTagAutocompleteInteraction({
  listboxId: searchTagListboxId,
  suggestionCount: tagSuggestionCount,
  getSuggestionId: (index) => visibleTagSuggestions.value[index]?.id,
});

watch(
  () => props.modelValue,
  () => {
    syncSearchCursorPosition();
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

async function selectTagSuggestion(index: number) {
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
  closeTagSuggestions();

  await nextTick();
  searchInput.value?.focus();
  searchInput.value?.setSelectionRange(replacement.cursor, replacement.cursor);
}

function onSearchInput(event: Event) {
  const target = event.target;
  if (target instanceof HTMLInputElement) {
    emit("update:modelValue", target.value);
  }
  syncSearchCursorPosition(event);
  resetActiveTagSuggestion();
  tagSuggestionsOpen.value =
    suggestSearchFieldTags(
      tagSuggestions.value,
      target instanceof HTMLInputElement ? target.value : props.modelValue,
      searchCursorPosition.value,
    ).length > 0;
}

function onSearchKeydown(event: KeyboardEvent) {
  if (event.key === "ArrowDown") {
    if (visibleTagSuggestions.value.length === 0) {
      return;
    }

    event.preventDefault();
    moveActiveTagSuggestion(1);
    return;
  }

  if (
    event.key === "ArrowUp" &&
    tagSuggestionsOpen.value &&
    visibleTagSuggestions.value.length > 0
  ) {
    event.preventDefault();
    moveActiveTagSuggestion(-1);
    return;
  }

  if ((event.key === "Enter" || event.key === "Tab") && tagSuggestionsOpen.value) {
    const hasSuggestion = visibleTagSuggestions.value.length > 0;
    if (!hasSuggestion) return;
    event.preventDefault();
    void selectTagSuggestion(selectableTagSuggestionIndex.value);
    return;
  }

  if (event.key === "Escape" && tagSuggestionsOpen.value) {
    event.preventDefault();
    closeTagSuggestions();
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
        class="ui-border-subtle ui-surface min-h-10 w-full border pr-8 pl-3 text-sm"
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
        @focus="syncSearchCursorPosition"
        @keydown="onSearchKeydown"
        @blur="closeTagSuggestions"
      />
      <button
        v-if="isSearchActive"
        type="button"
        class="ui-muted-link absolute top-px right-0 flex h-full w-8 cursor-pointer items-center justify-center text-xl select-none"
        aria-label="Clear search"
        title="Clear search"
        @click="emit('clear')"
      >
        <X :size="16" />
      </button>
      <ul
        v-if="tagSuggestionsOpen"
        :id="searchTagListboxId"
        class="ui-border-subtle ui-surface absolute z-20 mt-1 max-h-70 w-full overflow-auto border py-1 text-sm shadow-sm"
        role="listbox"
      >
        <li
          v-for="(tag, index) in visibleTagSuggestions"
          :id="`${searchTagListboxId}-${tag.id}`"
          :key="tag.id"
          class="cursor-pointer px-3 py-1.5"
          :class="
            index === activeTagSuggestionIndex ? 'ui-suggestion-selected' : 'ui-suggestion-hover'
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
</template>
