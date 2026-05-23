<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";

import { deleteTag, listTags, updateTag } from "../api";
import type { TagSummaryDTO } from "../types";
import TagsPagination from "./TagsPagination.vue";
import TagsTable from "./TagsTable.vue";
import { useLocalTagsPagination } from "./useLocalTagsPagination";

const TAGS_PAGE_SIZE = 500;

const tags = ref<TagSummaryDTO[]>([]);
const filterText = ref("");
const isLoading = ref(true);
const error = ref("");
const isSaving = ref(false);
const editingTag = ref<TagSummaryDTO | null>(null);
const editingName = ref("");
const editingError = ref("");

const filteredTags = computed(() => {
  const token = filterText.value.trim().toLocaleLowerCase("und");
  if (token === "") {
    return tags.value;
  }

  return tags.value.filter((tag) => tag.nameLower.includes(token));
});

const {
  visiblePage,
  totalPages,
  paginatedItems: paginatedTags,
  pageRangeStart,
  pageRangeEnd,
  hasPreviousPage,
  hasNextPage,
  goToPage: goToPaginationPage,
  resetPage,
} = useLocalTagsPagination(filteredTags, TAGS_PAGE_SIZE);

watch(filterText, () => {
  resetPage();
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

function goToPage(page: number) {
  goToPaginationPage(page);
  window.scrollTo({ top: 0, behavior: "instant" });
}

function openEditInline(tag: TagSummaryDTO) {
  editingTag.value = tag;
  editingName.value = tag.name;
  editingError.value = "";
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
      name="tags-filter"
      v-model="filterText"
      class="ui-field mt-2 block min-h-10 w-full border px-3 text-sm"
      placeholder="Filter by tag name"
      type="text"
      autocomplete="off"
      spellcheck="false"
      autocorrect="off"
      autocapitalize="off"
      data-1p-ignore
      data-lpignore
      data-bwignore
    />

    <p v-if="isLoading" class="ui-text-muted mt-4 text-sm">Loading tags...</p>
    <p v-else-if="isEmptyState" class="ui-text-muted mt-4 text-sm">No tags yet.</p>
    <p v-else-if="isFilterEmptyState" class="ui-text-muted mt-4 text-sm">
      No tags match this filter.
    </p>
    <div v-else class="mt-4">
      <TagsTable
        :tags="paginatedTags"
        :is-saving="isSaving"
        :editing-tag="editingTag"
        v-model:editing-name="editingName"
        :editing-error="editingError"
        @edit-request="openEditInline"
        @delete-request="onDelete"
        @save-edit="saveEditInline"
        @cancel-edit="closeEditInline"
      />

      <TagsPagination
        :page="visiblePage"
        :total-pages="totalPages"
        :total-count="filteredTags.length"
        :range-start="pageRangeStart"
        :range-end="pageRangeEnd"
        :has-previous-page="hasPreviousPage"
        :has-next-page="hasNextPage"
        @page-change="goToPage"
      />
    </div>
  </section>
</template>
