<script setup lang="ts">
import { PencilIcon, Trash2Icon } from "@lucide/vue";
import { computed, nextTick, ref, watch } from "vue";
import type { ComponentPublicInstance } from "vue";
import { RouterLink } from "vue-router";

import type { TagSummaryDTO } from "../types";

const props = defineProps<{
  tags: TagSummaryDTO[];
  isSaving: boolean;
  editingTag: TagSummaryDTO | null;
  editingName: string;
  editingError: string;
}>();

const emit = defineEmits<{
  "edit-request": [tag: TagSummaryDTO];
  "delete-request": [tag: TagSummaryDTO];
  "save-edit": [];
  "cancel-edit": [];
  "update:editingName": [name: string];
}>();

const editingNameInput = ref<HTMLInputElement | null>(null);
const editingNameModel = computed({
  get: () => props.editingName,
  set: (value: string) => emit("update:editingName", value),
});

watch(
  () => props.editingTag?.id,
  async (editingTagId) => {
    if (editingTagId === undefined) {
      return;
    }

    await nextTick();
    editingNameInput.value?.focus();
  },
);

function setEditingNameInputRef(element: Element | ComponentPublicInstance | null) {
  if (element instanceof HTMLInputElement) {
    editingNameInput.value = element;
    return;
  }

  editingNameInput.value = null;
}

function onEditInputKeydown(event: KeyboardEvent) {
  if (event.key === "Enter") {
    event.preventDefault();
    emit("save-edit");
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    emit("cancel-edit");
  }
}
</script>

<template>
  <table class="ui-border-subtle w-full border-collapse text-left">
    <tbody>
      <tr v-for="tag in tags" :key="tag.id" class="group border-b border-transparent">
        <!-- Column 1: Action buttons (Edit & Delete) -->
        <td class="w-20 pr-4 align-middle">
          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100">
            <button
              class="inline-flex min-h-8 min-w-8 items-center justify-center border border-(--ui-border-subtle) text-(--ui-text-muted) hover:border-(--ui-link) hover:text-(--ui-link) focus-visible:border-(--ui-link) focus-visible:text-(--ui-link) focus-visible:outline-none"
              type="button"
              :aria-label="`Edit tag ${tag.name}`"
              :title="`Edit tag ${tag.name}`"
              :disabled="isSaving"
              @click="emit('edit-request', tag)"
            >
              <PencilIcon class="size-4" aria-hidden="true" />
            </button>
            <button
              class="inline-flex min-h-8 min-w-8 items-center justify-center border border-(--ui-border-subtle) text-(--ui-text-muted) hover:border-(--ui-danger-border) hover:text-(--ui-danger-text-readable) focus-visible:border-(--ui-danger-border) focus-visible:text-(--ui-danger-text-readable) focus-visible:outline-none"
              type="button"
              :aria-label="`Delete tag ${tag.name}`"
              :title="`Delete tag ${tag.name}`"
              :disabled="isSaving || editingTag?.id === tag.id"
              @click="emit('delete-request', tag)"
            >
              <Trash2Icon class="size-4" aria-hidden="true" />
            </button>
          </div>
        </td>

        <!-- Column 2: Usage count -->
        <td class="w-16 pr-4 align-middle">
          <span class="ui-text-muted text-xs">{{ tag.usageCount }}</span>
        </td>

        <!-- Column 3: Tag name OR Inline editor -->
        <td class="w-full min-w-0 align-middle">
          <!-- Inline editor view -->
          <div v-if="editingTag?.id === tag.id" class="w-full min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <input
                :ref="setEditingNameInputRef"
                v-model="editingNameModel"
                class="ui-field min-h-10 w-full min-w-48 flex-1 border px-3 text-sm"
                type="text"
                :disabled="isSaving"
                @keydown="onEditInputKeydown"
              />
              <button
                class="ui-action inline-flex min-h-10 shrink-0 items-center justify-center px-3 text-sm font-semibold transition"
                type="button"
                :disabled="isSaving"
                @click="emit('save-edit')"
              >
                Save
              </button>
              <button
                class="ui-border ui-text-emphasis inline-flex min-h-10 shrink-0 items-center justify-center border px-3 text-sm font-semibold transition hover:bg-slate-50"
                type="button"
                :disabled="isSaving"
                @click="emit('cancel-edit')"
              >
                Cancel
              </button>
            </div>
            <p v-if="editingError" class="ui-danger-text mt-1 text-sm">{{ editingError }}</p>
          </div>

          <!-- Default link view -->
          <RouterLink
            v-else
            class="min-w-0 text-sm font-semibold text-(--ui-text-emphasis) underline decoration-(--ui-border-subtle) underline-offset-[3px] hover:text-(--ui-link)"
            :to="{ name: 'bookmark-tag-shortcut', params: { tags: tag.nameLower } }"
          >
            {{ tag.name }}
          </RouterLink>
        </td>
      </tr>
    </tbody>
  </table>
</template>
