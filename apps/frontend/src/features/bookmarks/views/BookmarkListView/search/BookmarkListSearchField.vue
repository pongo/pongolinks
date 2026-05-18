<script setup lang="ts">
import { ref } from "vue";

import { listTags } from "#/features/tags/api.ts";
import type { TagSummaryDTO } from "#/features/tags/types.ts";
import BookmarkTagAutocompleteInput from "../../../components/autocomplete/BookmarkTagAutocompleteInput.vue";
import { replaceCurrentSearchTagToken, suggestSearchFieldTags } from "./search-tag-autocomplete.ts";

defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
  submit: [];
  clear: [];
}>();

const tagSuggestions = ref<TagSummaryDTO[]>([]);
const tagAutocomplete = {
  replaceCurrentTagToken: replaceCurrentSearchTagToken,
  suggestTags: suggestSearchFieldTags,
};

void (async () => {
  const tagsResult = await listTags();
  if (tagsResult.isOk) {
    tagSuggestions.value = tagsResult.value.tags;
  }
})();
</script>

<template>
  <form class="mb-4 flex items-center gap-2" @submit.prevent="emit('submit')">
    <BookmarkTagAutocompleteInput
      class="w-full"
      :model-value="modelValue"
      :tag-suggestions="tagSuggestions"
      :autocomplete="tagAutocomplete"
      input-class="ui-border-subtle ui-surface min-h-10 w-full border pr-8 pl-3 text-sm"
      listbox-class="ui-border-subtle ui-surface absolute z-20 mt-1 max-h-70 w-full overflow-auto border py-1 text-sm shadow-sm"
      option-class="ui-text-emphasis cursor-pointer px-3 py-2"
      placeholder="Search: sqlite #vue -#old @example.com"
      aria-label="Search bookmarks"
      search-tag-listbox-id="bookmark-list-search-tag-suggestions"
      show-clear-button
      @update:model-value="emit('update:modelValue', $event)"
      @clear="emit('clear')"
    />
    <button class="ui-action min-h-10 px-4 text-sm font-semibold" type="submit">Search</button>
  </form>
</template>
