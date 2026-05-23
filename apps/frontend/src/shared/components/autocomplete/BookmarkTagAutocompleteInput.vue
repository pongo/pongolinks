<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { X } from "@lucide/vue";

import type { TagSummaryDTO } from "#/features/tags/types.ts";
import { useTagAutocompleteInteraction } from "./useTagAutocompleteInteraction.ts";

type TagAutocompleteReplacement = {
  value: string;
  cursor: number;
};

type TagAutocomplete = {
  replaceCurrentTagToken: (
    value: string,
    cursor: number,
    tagName: string,
  ) => TagAutocompleteReplacement;
  suggestTags: (tags: TagSummaryDTO[], value: string, cursor: number) => TagSummaryDTO[];
};

type EnterKeyBehavior = "select-suggestion" | "submit";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    tagSuggestions: TagSummaryDTO[];
    autocomplete: TagAutocomplete;
    ariaLabel?: string;
    inputClass: string;
    placeholder?: string;
    tagListboxId: string;
    showClearButton?: boolean;
    enterKeyBehavior?: EnterKeyBehavior;
  }>(),
  {
    ariaLabel: undefined,
    placeholder: "",
    showClearButton: false,
    enterKeyBehavior: "select-suggestion",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
  submit: [];
  clear: [];
}>();

const input = ref<HTMLInputElement>();
const textValue = ref(props.modelValue);
const cursorPosition = ref(0);
const shouldShowClearButton = computed(
  () => props.showClearButton && textValue.value.trim().length > 0,
);
const text = computed({
  get: () => textValue.value,
  set: (value: string) => {
    textValue.value = value;
    emit("update:modelValue", value);
  },
});
const visibleTagSuggestions = computed(() =>
  props.autocomplete.suggestTags(props.tagSuggestions, textValue.value, cursorPosition.value),
);
const tagSuggestionCount = computed(() => visibleTagSuggestions.value.length);
const {
  activeDescendantId,
  activeIndex,
  close: closeTagSuggestions,
  isOpen: tagSuggestionsOpen,
  moveActive: moveActiveTagSuggestion,
  openIfAny: openTagSuggestions,
  resetActive: resetActiveTagSuggestion,
  selectableIndex: selectableTagSuggestionIndex,
} = useTagAutocompleteInteraction({
  listboxId: props.tagListboxId,
  suggestionCount: tagSuggestionCount,
  getSuggestionId: (index) => visibleTagSuggestions.value[index]?.id,
});

watch(
  () => props.modelValue,
  (value) => {
    if (value !== textValue.value) {
      textValue.value = value;
    }
  },
);

function updateCursor(event?: Event) {
  const target = event?.target instanceof HTMLInputElement ? event.target : input.value;
  cursorPosition.value = target?.selectionStart ?? textValue.value.length;
}

function updateTagSuggestions(event: Event) {
  updateCursor(event);
  resetActiveTagSuggestion();
  openTagSuggestions();
}

async function selectTagSuggestion(index: number) {
  const tag = visibleTagSuggestions.value[index];
  if (!tag) {
    return;
  }

  const replacement = props.autocomplete.replaceCurrentTagToken(
    textValue.value,
    cursorPosition.value,
    tag.name,
  );
  text.value = replacement.value;
  cursorPosition.value = replacement.cursor;
  closeTagSuggestions();

  await nextTick();
  input.value?.focus();
  input.value?.setSelectionRange(replacement.cursor, replacement.cursor);
}

function handleKeydown(event: KeyboardEvent) {
  updateCursor(event);

  if (event.key === "ArrowDown") {
    if (visibleTagSuggestions.value.length === 0) return;
    preventAndMove(1);
    return;
  }

  if (event.key === "ArrowUp" && tagSuggestionsOpen.value) {
    preventAndMove(-1);
    return;
  }

  const isTab = event.key === "Tab";
  const isEnterSelectingSuggestion =
    event.key === "Enter" && props.enterKeyBehavior === "select-suggestion";

  if (tagSuggestionsOpen.value && (isTab || isEnterSelectingSuggestion)) {
    preventAndSelect();
    return;
  }

  if (event.key === "Enter") {
    if (tagSuggestionsOpen.value) {
      preventAndSelect();
    } else {
      closeTagSuggestions();
    }
    emit("submit");
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

  function preventAndMove(offset: number) {
    event.preventDefault();
    moveActiveTagSuggestion(offset);
  }

  function preventAndSelect() {
    event.preventDefault();
    void selectTagSuggestion(selectableTagSuggestionIndex.value);
  }
}

function focusInput() {
  input.value?.focus();
}

defineExpose({
  focusInput,
});
</script>

<template>
  <div class="relative">
    <input
      ref="input"
      v-model="text"
      :class="inputClass"
      type="text"
      id="search-and-tags"
      autocomplete="off"
      spellcheck="false"
      autocorrect="off"
      autocapitalize="off"
      :placeholder="placeholder"
      :aria-label="ariaLabel"
      role="combobox"
      :aria-expanded="tagSuggestionsOpen"
      :aria-controls="tagListboxId"
      :aria-activedescendant="activeDescendantId"
      @input="updateTagSuggestions"
      @click="updateTagSuggestions"
      @keyup="updateCursor"
      @focus="updateCursor"
      @keydown="handleKeydown"
      @blur="closeTagSuggestions"
    />
    <button
      v-if="shouldShowClearButton"
      type="button"
      class="ui-muted-link absolute top-px right-0 flex h-full w-8 cursor-pointer items-center justify-center text-xl select-none"
      aria-label="Clear"
      title="Clear"
      @click="emit('clear')"
    >
      <X :size="16" />
    </button>
    <ul
      v-if="tagSuggestionsOpen"
      :id="tagListboxId"
      class="ui-border-subtle ui-surface absolute z-10 mt-1 max-h-70 w-full overflow-y-auto border py-1 text-sm shadow-sm"
      role="listbox"
    >
      <li
        v-for="(tag, index) in visibleTagSuggestions"
        :id="`${tagListboxId}-${tag.id}`"
        :key="tag.id"
        class="ui-text-emphasis cursor-pointer px-3 py-2 text-sm"
        :class="[index === activeIndex ? 'ui-suggestion-selected' : 'ui-suggestion-hover']"
        role="option"
        :aria-selected="index === activeIndex"
        @mousedown.prevent="selectTagSuggestion(index)"
      >
        {{ tag.name }}
      </li>
    </ul>
  </div>
</template>
