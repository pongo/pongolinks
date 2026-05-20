<script setup lang="ts">
import { ref } from "vue";

import { listTags } from "#/features/tags/api.ts";
import type { TagSummaryDTO } from "#/features/tags/types.ts";
import BookmarkTagAutocompleteInput from "../../../../../shared/components/autocomplete/BookmarkTagAutocompleteInput.vue";
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
      :autocomplete="{
        replaceCurrentTagToken: replaceCurrentSearchTagToken,
        suggestTags: suggestSearchFieldTags,
      }"
      input-class="ui-border-subtle ui-surface min-h-10 w-full border pr-8 pl-3 text-sm"
      placeholder="Search: sqlite #vue -#old @example.com"
      aria-label="Search bookmarks"
      tag-listbox-id="bookmark-list-search-tag-suggestions"
      show-clear-button
      @update:model-value="emit('update:modelValue', $event)"
      @clear="emit('clear')"
    />
    <button class="ui-action min-h-10 px-4 text-sm font-semibold" type="submit">Search</button>
  </form>
</template>
