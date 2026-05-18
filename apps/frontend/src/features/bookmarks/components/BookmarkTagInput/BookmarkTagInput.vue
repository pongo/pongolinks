<script setup lang="ts">
import { ref } from "vue";

import type { TagSummaryDTO } from "#/features/tags/types.ts";
import BookmarkTagAutocompleteInput from "../autocomplete/BookmarkTagAutocompleteInput.vue";
import { replaceCurrentTagToken, suggestTags } from "./tag-autocomplete";

defineProps<{
  modelValue: string;
  tagSuggestions?: TagSummaryDTO[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const autocompleteInput = ref<InstanceType<typeof BookmarkTagAutocompleteInput>>();
const tagAutocomplete = {
  replaceCurrentTagToken,
  suggestTags,
};

function focusInput() {
  autocompleteInput.value?.focusInput();
}

defineExpose({
  focusInput,
});
</script>

<template>
  <label class="block">
    <span class="ui-text-emphasis mb-2 block text-sm font-semibold">Tags</span>
    <BookmarkTagAutocompleteInput
      ref="autocompleteInput"
      :model-value="modelValue"
      :tag-suggestions="tagSuggestions ?? []"
      :autocomplete="tagAutocomplete"
      input-class="ui-field w-full border px-3 py-2 text-sm transition outline-none focus:ring-2"
      placeholder=""
      @update:model-value="emit('update:modelValue', $event)"
    />
    <span hidden class="ui-text-muted mt-2 block text-sm">Separate tags with spaces.</span>
  </label>
</template>
