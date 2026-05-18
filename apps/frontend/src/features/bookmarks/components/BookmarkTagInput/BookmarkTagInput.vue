<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";

import type { TagSummaryDTO } from "#/features/tags/types.ts";
import { useTagAutocompleteInteraction } from "../autocomplete/useTagAutocompleteInteraction.ts";
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
const tagSuggestionCount = computed(() => visibleTagSuggestions.value.length);
const {
  activeDescendantId: activeTagSuggestionId,
  activeIndex: activeTagSuggestionIndex,
  close: closeTagSuggestions,
  isOpen: tagSuggestionsOpen,
  moveActive: moveActiveTagSuggestion,
  openIfAny: openTagSuggestions,
  resetActive: resetActiveTagSuggestion,
  selectableIndex: selectableTagSuggestionIndex,
} = useTagAutocompleteInteraction({
  listboxId: tagListboxId,
  suggestionCount: tagSuggestionCount,
  getSuggestionId: (index) => visibleTagSuggestions.value[index]?.id,
});

watch(
  () => props.modelValue,
  (value) => {
    if (value !== tagsTextValue.value) {
      tagsTextValue.value = value;
    }
  },
);

function updateTagCursor(event?: Event) {
  const target = event?.target instanceof HTMLInputElement ? event.target : tagsInput.value;
  tagCursorPosition.value = target?.selectionStart ?? tagsTextValue.value.length;
}

function updateTagSuggestions(event: Event) {
  updateTagCursor(event);
  resetActiveTagSuggestion();
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
    void selectTagSuggestion(selectableTagSuggestionIndex.value);
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

function focusInput() {
  tagsInput.value?.focus();
}

defineExpose({
  focusInput,
});
</script>

<template>
  <label class="block">
    <span class="ui-text-emphasis mb-2 block text-sm font-semibold">Tags</span>
    <div class="relative">
      <input
        ref="tagsInput"
        v-model="tagsText"
        class="ui-field w-full border px-3 py-2 text-sm transition outline-none focus:ring-2"
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
        class="ui-border-subtle ui-surface absolute z-10 mt-1 max-h-70 w-full overflow-y-auto border py-1 shadow-sm"
        role="listbox"
      >
        <li
          v-for="(tag, index) in visibleTagSuggestions"
          :id="`${tagListboxId}-${tag.id}`"
          :key="tag.id"
          class="ui-text-emphasis cursor-pointer px-3 py-2 text-sm"
          :class="
            index === activeTagSuggestionIndex ? 'ui-suggestion-selected' : 'ui-suggestion-hover'
          "
          role="option"
          :aria-selected="index === activeTagSuggestionIndex"
          @mousedown.prevent="selectTagSuggestion(index)"
        >
          {{ tag.name }}
        </li>
      </ul>
    </div>
    <span hidden class="ui-text-muted mt-2 block text-sm">Separate tags with spaces.</span>
  </label>
</template>
