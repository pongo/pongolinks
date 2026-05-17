<script setup lang="ts">
import { PencilIcon, Trash2Icon } from "@lucide/vue";
import { APP_BASE_PATH } from "@pongolinks/shared/app-config";
import { computed, nextTick, onMounted, ref } from "vue";
import type { ComponentPublicInstance } from "vue";

import { deleteTag, listTags, updateTag } from "../api";
import type { TagSummaryDTO } from "../types";

const tags = ref<TagSummaryDTO[]>([]);
const filterText = ref("");
const isLoading = ref(true);
const error = ref("");
const isSaving = ref(false);
const editingTag = ref<TagSummaryDTO | null>(null);
const editingName = ref("");
const editingError = ref("");
const editingNameInput = ref<HTMLInputElement | null>(null);

function setEditingNameInputRef(element: Element | ComponentPublicInstance | null) {
  if (element instanceof HTMLInputElement) {
    editingNameInput.value = element;
    return;
  }

  editingNameInput.value = null;
}

const filteredTags = computed(() => {
  const token = filterText.value.trim().toLocaleLowerCase("und");
  if (token === "") {
    return tags.value;
  }

  return tags.value.filter((tag) => tag.nameLower.includes(token));
});

const isEmptyState = computed(() => !isLoading.value && tags.value.length === 0);
const isFilterEmptyState = computed(
  () => !isLoading.value && tags.value.length > 0 && filteredTags.value.length === 0,
);

onMounted(async () => {
  await loadTags();
});

async function loadTags() {
  isLoading.value = true;
  error.value = "";

  const result = await listTags();
  if (result.isErr) {
    error.value = result.error.formErrors.form ?? result.error.message;
  } else {
    tags.value = result.value.tags;
  }

  isLoading.value = false;
}

async function openEditDialog(tag: TagSummaryDTO) {
  editingTag.value = tag;
  editingName.value = tag.name;
  editingError.value = "";
  await nextTick();
  editingNameInput.value?.focus();
}

function closeEditInline() {
  editingTag.value = null;
  editingName.value = "";
  editingError.value = "";
  isSaving.value = false;
}

async function saveEditInline() {
  if (!editingTag.value) {
    return;
  }

  isSaving.value = true;
  editingError.value = "";
  const result = await updateTag(editingTag.value.id, editingName.value);
  isSaving.value = false;

  if (result.isErr) {
    editingError.value = result.error.formErrors.form ?? result.error.message;
    return;
  }

  closeEditInline();
  await loadTags();
}

function onEditInputKeydown(event: KeyboardEvent) {
  if (event.key === "Enter") {
    event.preventDefault();
    void saveEditInline();
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    closeEditInline();
  }
}

async function onDelete(tag: TagSummaryDTO) {
  if (!window.confirm(`Delete tag "${tag.name}"?`)) {
    return;
  }

  const result = await deleteTag(tag.id);
  if (result.isErr) {
    error.value = result.error.formErrors.form ?? result.error.message;
    return;
  }

  await loadTags();
}
</script>

<template>
  <section class="ui-border ui-surface border px-5 py-5">
    <p v-if="error" class="ui-danger-banner mb-4 border-l-4 px-4 py-3 text-sm font-medium">
      {{ error }}
    </p>

    <label class="ui-text-emphasis text-sm font-semibold" for="tags-filter">Filter tags</label>
    <input
      id="tags-filter"
      v-model="filterText"
      class="ui-field mt-2 block min-h-10 w-full border px-3 text-sm"
      placeholder="Filter by tag name"
      type="text"
    />

    <p v-if="isLoading" class="ui-text-muted mt-4 text-sm">Loading tags...</p>
    <p v-else-if="isEmptyState" class="ui-text-muted mt-4 text-sm">No tags yet.</p>
    <p v-else-if="isFilterEmptyState" class="ui-text-muted mt-4 text-sm">
      No tags match this filter.
    </p>
    <ul v-else class="ui-border-subtle mt-4">
      <li v-for="tag in filteredTags" :key="tag.id" class="group flex items-center gap-4">
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100">
            <button
              class="tag-icon-button"
              type="button"
              :aria-label="`Edit tag ${tag.name}`"
              :disabled="isSaving"
              @click="openEditDialog(tag)"
            >
              <PencilIcon class="size-4" aria-hidden="true" />
            </button>
            <button
              class="tag-icon-button tag-icon-button-danger"
              type="button"
              :aria-label="`Delete tag ${tag.name}`"
              :disabled="isSaving || editingTag?.id === tag.id"
              @click="onDelete(tag)"
            >
              <Trash2Icon class="size-4" aria-hidden="true" />
            </button>
          </div>
          <span class="ui-text-muted text-xs">{{ tag.usageCount }}</span>
        </div>

        <div v-if="editingTag?.id === tag.id" class="tag-inline-editor min-w-0">
          <div class="tag-inline-editor-controls">
            <input
              :ref="setEditingNameInputRef"
              v-model="editingName"
              class="ui-field tag-inline-editor-input min-h-10 border px-3 text-sm"
              type="text"
              :disabled="isSaving"
              @keydown="onEditInputKeydown"
            />
            <button
              class="ui-action inline-flex min-h-10 items-center justify-center px-3 text-sm font-semibold transition"
              type="button"
              :disabled="isSaving"
              @click="saveEditInline"
            >
              Save
            </button>
            <button
              class="ui-border ui-text-emphasis inline-flex min-h-10 items-center justify-center border px-3 text-sm font-semibold transition hover:bg-slate-50"
              type="button"
              :disabled="isSaving"
              @click="closeEditInline"
            >
              Cancel
            </button>
          </div>
          <p v-if="editingError" class="ui-danger-text mt-1 text-sm">{{ editingError }}</p>
        </div>
        <a
          v-else
          class="tag-row-link min-w-0 text-sm font-semibold"
          :href="`${APP_BASE_PATH}/t/${encodeURIComponent(tag.nameLower)}`"
        >
          {{ tag.name }}
        </a>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.tag-row-link {
  color: var(--ui-text-emphasis);
  text-decoration: underline;
  text-decoration-color: var(--ui-border-subtle);
  text-underline-offset: 3px;
}

.tag-row-link:hover {
  color: var(--ui-link);
}

.tag-icon-button {
  display: inline-flex;
  min-height: 2rem;
  min-width: 2rem;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--ui-border-subtle);
  color: var(--ui-text-muted);
}

.tag-icon-button:hover,
.tag-icon-button:focus-visible {
  border-color: var(--ui-link);
  color: var(--ui-link);
  outline: none;
}

.tag-icon-button-danger:hover,
.tag-icon-button-danger:focus-visible {
  border-color: var(--ui-danger-border);
  color: var(--ui-danger-text-readable);
}

.tag-inline-editor {
  flex: 1;
}

.tag-inline-editor-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.tag-inline-editor-input {
  flex: 1;
  min-width: 12rem;
}
</style>
