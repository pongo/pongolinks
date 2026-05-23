<script setup lang="ts">
import { ChevronLeftIcon, ChevronRightIcon, PencilIcon, Trash2Icon } from "@lucide/vue";
import { computed, nextTick, onMounted, ref, watch } from "vue";
import type { ComponentPublicInstance } from "vue";
import { RouterLink } from "vue-router";

import { createPaginationWindow, type PaginationWindowItem } from "#/shared/pagination-window.ts";
import { deleteTag, listTags, updateTag } from "../api";
import type { TagSummaryDTO } from "../types";

const TAGS_PAGE_SIZE = 500;

const tags = ref<TagSummaryDTO[]>([]);
const filterText = ref("");
const currentPage = ref(1);
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

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredTags.value.length / TAGS_PAGE_SIZE)),
);
const visiblePage = computed(() => Math.min(currentPage.value, totalPages.value));
const paginatedTags = computed(() => {
  const start = (visiblePage.value - 1) * TAGS_PAGE_SIZE;
  return filteredTags.value.slice(start, start + TAGS_PAGE_SIZE);
});
const paginationItems = computed(() =>
  createPaginationWindow({
    page: visiblePage.value,
    totalPages: totalPages.value,
  }),
);
const pageRangeStart = computed(() => {
  if (filteredTags.value.length === 0) {
    return 0;
  }

  return (visiblePage.value - 1) * TAGS_PAGE_SIZE + 1;
});
const pageRangeEnd = computed(() =>
  Math.min(visiblePage.value * TAGS_PAGE_SIZE, filteredTags.value.length),
);
const hasPreviousPage = computed(() => visiblePage.value > 1);
const hasNextPage = computed(() => visiblePage.value < totalPages.value);

watch(filterText, () => {
  currentPage.value = 1;
});

watch(totalPages, (nextTotalPages) => {
  if (currentPage.value > nextTotalPages) {
    currentPage.value = nextTotalPages;
  }
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
  currentPage.value = Math.max(1, Math.min(page, totalPages.value));
  window.scrollTo({ top: 0, behavior: "instant" });
}

function paginationItemKey(item: PaginationWindowItem) {
  return item.type === "page" ? `page-${item.page}` : `ellipsis-${item.key}`;
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
      <table class="ui-border-subtle w-full border-collapse text-left">
        <tbody>
          <tr v-for="tag in paginatedTags" :key="tag.id" class="group border-b border-transparent">
            <!-- Column 1: Action buttons (Edit & Delete) -->
            <td class="w-20 pr-4 align-middle">
              <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                <button
                  class="tag-icon-button"
                  type="button"
                  :aria-label="`Edit tag ${tag.name}`"
                  :title="`Edit tag ${tag.name}`"
                  :disabled="isSaving"
                  @click="openEditDialog(tag)"
                >
                  <PencilIcon class="size-4" aria-hidden="true" />
                </button>
                <button
                  class="tag-icon-button tag-icon-button-danger"
                  type="button"
                  :aria-label="`Delete tag ${tag.name}`"
                  :title="`Delete tag ${tag.name}`"
                  :disabled="isSaving || editingTag?.id === tag.id"
                  @click="onDelete(tag)"
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
              <div v-if="editingTag?.id === tag.id" class="tag-inline-editor w-full min-w-0">
                <div class="tag-inline-editor-controls flex gap-2">
                  <input
                    :ref="setEditingNameInputRef"
                    v-model="editingName"
                    class="ui-field tag-inline-editor-input min-h-10 w-full border px-3 text-sm"
                    type="text"
                    :disabled="isSaving"
                    @keydown="onEditInputKeydown"
                  />
                  <button
                    class="ui-action inline-flex min-h-10 shrink-0 items-center justify-center px-3 text-sm font-semibold transition"
                    type="button"
                    :disabled="isSaving"
                    @click="saveEditInline"
                  >
                    Save
                  </button>
                  <button
                    class="ui-border ui-text-emphasis inline-flex min-h-10 shrink-0 items-center justify-center border px-3 text-sm font-semibold transition hover:bg-slate-50"
                    type="button"
                    :disabled="isSaving"
                    @click="closeEditInline"
                  >
                    Cancel
                  </button>
                </div>
                <p v-if="editingError" class="ui-danger-text mt-1 text-sm">{{ editingError }}</p>
              </div>

              <!-- Default link view -->
              <RouterLink
                v-else
                class="tag-row-link min-w-0 text-sm font-semibold"
                :to="{ name: 'bookmark-tag-shortcut', params: { tags: tag.nameLower } }"
              >
                {{ tag.name }}
              </RouterLink>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p class="ui-text-muted text-sm">
          Showing {{ pageRangeStart }}-{{ pageRangeEnd }} of {{ filteredTags.length }}
          {{ filteredTags.length === 1 ? "tag" : "tags" }}
        </p>

        <nav
          v-if="totalPages > 1"
          class="flex items-center gap-1 select-none"
          aria-label="Tag pages"
        >
          <button
            v-if="hasPreviousPage"
            class="ui-muted-link ui-border-subtle inline-flex size-9 items-center justify-center border text-sm font-semibold"
            type="button"
            aria-label="Previous page"
            @click="goToPage(visiblePage - 1)"
          >
            <ChevronLeftIcon class="size-4" aria-hidden="true" />
          </button>

          <template v-for="item in paginationItems" :key="paginationItemKey(item)">
            <button
              v-if="item.type === 'page'"
              class="inline-flex size-9 items-center justify-center border text-sm font-semibold transition"
              :class="item.page === visiblePage ? 'ui-action' : 'ui-muted-link ui-border-subtle'"
              type="button"
              :aria-current="item.page === visiblePage ? 'page' : undefined"
              @click="goToPage(item.page)"
            >
              {{ item.page }}
            </button>
            <span v-else class="ui-text-muted inline-flex size-9 items-center justify-center">
              &hellip;
            </span>
          </template>

          <button
            v-if="hasNextPage"
            class="ui-muted-link ui-border-subtle inline-flex size-9 items-center justify-center border text-sm font-semibold"
            type="button"
            aria-label="Next page"
            @click="goToPage(visiblePage + 1)"
          >
            <ChevronRightIcon class="size-4" aria-hidden="true" />
          </button>
        </nav>
      </div>
    </div>
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
