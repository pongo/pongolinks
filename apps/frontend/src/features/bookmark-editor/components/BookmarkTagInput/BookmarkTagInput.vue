<script setup lang="ts">
import { ref } from "vue";

import type { TagSummaryDTO } from "#/features/tags/types.ts";
import BookmarkTagAutocompleteInput from "../../../../shared/components/autocomplete/BookmarkTagAutocompleteInput.vue";
import { replaceCurrentTagToken, suggestTags } from "./tag-autocomplete.ts";

defineProps<{
  modelValue: string;
  tagSuggestions?: TagSummaryDTO[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const autocompleteInput = ref<InstanceType<typeof BookmarkTagAutocompleteInput>>();

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
      :autocomplete="{ replaceCurrentTagToken, suggestTags }"
      input-class="ui-field w-full border px-3 py-2 text-sm transition outline-none focus:ring-2"
      placeholder=""
      tag-listbox-id="bookmark-tag-suggestions"
      @update:model-value="emit('update:modelValue', $event)"
    />
    <span hidden class="ui-text-muted mt-2 block text-sm">Separate tags with spaces.</span>
  </label>
</template>
