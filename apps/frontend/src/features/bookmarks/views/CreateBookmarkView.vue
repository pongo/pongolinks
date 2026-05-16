<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";

import type { FormErrors } from "#/shared/api/errors.ts";
import { listTags } from "#/features/tags/api.ts";
import type { TagSummaryDTO } from "#/features/tags/types.ts";
import { createBookmark } from "../api/api";
import BookmarkForm from "../components/BookmarkForm.vue";
import type { EditableBookmarkPayload } from "../types";
import {
  chooseBookmarkCreateUrl,
  createInitialBookmarkPayload,
  resolveCreateBookmarkState,
  type CreateBookmarkState,
} from "./create-bookmark-flow";
import { diffUrls } from "./url-diff";

const route = useRoute();
const router = useRouter();
const errors = ref<FormErrors>({});
const isSaving = ref(false);
const tagSuggestions = ref<TagSummaryDTO[]>([]);
const state = ref<CreateBookmarkState>(
  resolveCreateBookmarkState({
    url: route.query.url as string | string[] | undefined,
    title: route.query.title as string | string[] | undefined,
  }),
);
const urlChoiceDiff = computed(() =>
  state.value.kind === "choose-url" ? diffUrls(state.value.originalUrl, state.value.cleanedUrl) : null,
);
const formInitialValues = computed(() =>
  state.value.kind === "create-form" ? createInitialBookmarkPayload(state.value) : undefined,
);
const formInitialFocusTarget = computed(() =>
  state.value.kind === "create-form" ? state.value.focusTarget : "url",
);

onMounted(async () => {
  const result = await listTags();

  if (result.isOk) {
    tagSuggestions.value = result.value.tags;
  }
});

async function saveBookmark(payload: EditableBookmarkPayload) {
  isSaving.value = true;
  errors.value = {};

  const result = await createBookmark(payload);

  if (result.isOk) {
    await router.push("/");
  } else {
    errors.value = result.error.formErrors;
  }

  isSaving.value = false;
}

function chooseOriginalUrl() {
  if (state.value.kind !== "choose-url") {
    return;
  }

  state.value = chooseBookmarkCreateUrl(state.value, "original");
}

function chooseCleanedUrl() {
  if (state.value.kind !== "choose-url") {
    return;
  }

  state.value = chooseBookmarkCreateUrl(state.value, "cleaned");
}
</script>

<template>
  <main class="ui-page-text min-h-screen px-4 py-8 sm:px-6">
    <section class="mx-auto max-w-3xl">
      <RouterLink class="ui-link text-sm font-semibold" to="/"> Back to bookmarks </RouterLink>
      <h1 class="ui-text-strong mt-5 text-2xl font-bold">New bookmark</h1>
      <div v-if="state.kind === 'choose-url'" class="py-6">
        <p class="ui-text-muted text-sm">
          We found a cleaned version of this URL. Choose which one to continue with.
        </p>

        <div class="mt-4 grid gap-4">
          <button
            class="ui-border ui-surface ui-text-emphasis w-full border px-4 py-4 text-left"
            type="button"
            @click="chooseOriginalUrl"
          >
            <p class="text-sm font-semibold">Use original URL</p>
            <p class="ui-text-muted mt-1 text-sm break-all">{{ state.originalUrl }}</p>
          </button>

          <button
            class="ui-border ui-surface ui-text-emphasis w-full border px-4 py-4 text-left"
            type="button"
            @click="chooseCleanedUrl"
          >
            <p class="text-sm font-semibold">Use cleaned URL</p>
            <p class="ui-text-muted mt-1 text-sm break-all">{{ state.cleanedUrl }}</p>
          </button>
        </div>

        <div
          v-if="urlChoiceDiff && (urlChoiceDiff.nonQueryChanged || urlChoiceDiff.queryDiffs.length > 0)"
          class="ui-border ui-surface mt-5 border px-4 py-4"
        >
          <p class="ui-text-emphasis text-sm font-semibold">Detected changes</p>
          <p v-if="urlChoiceDiff.nonQueryChanged" class="ui-danger-text mt-2 text-sm">
            Protocol, host, path, port, or hash changed.
          </p>
          <ul v-if="urlChoiceDiff.queryDiffs.length > 0" class="mt-2 space-y-2 text-sm">
            <li
              v-for="change in urlChoiceDiff.queryDiffs"
              :key="`${change.kind}-${change.key}`"
              class="ui-text-muted"
            >
              <span v-if="change.kind === 'removed'" class="ui-danger-text font-semibold">
                Removed query param:
              </span>
              <span v-else-if="change.kind === 'changed'" class="ui-danger-text font-semibold">
                Changed query param:
              </span>
              <span v-else class="ui-text-emphasis font-semibold"> Added query param: </span>
              <span class="break-all">
                {{ change.key }}
                <template v-if="change.kind === 'removed'">={{ change.originalValue }}</template>
                <template v-else-if="change.kind === 'changed'">
                  ({{ change.originalValue }} -> {{ change.cleanedValue }})
                </template>
                <template v-else>= {{ change.cleanedValue }}</template>
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div v-else class="py-6">
        <BookmarkForm
          :errors="errors"
          :initial-create-values="formInitialValues"
          :initial-focus-target="formInitialFocusTarget"
          :is-saving="isSaving"
          :tag-suggestions="tagSuggestions"
          submit-label="Create bookmark"
          @submit="saveBookmark"
        />
      </div>
    </section>
  </main>
</template>
