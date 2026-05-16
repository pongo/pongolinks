<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";

import type { FormErrors } from "#/shared/api/errors.ts";
import { checkBookmarkUrl } from "#/features/search/api.ts";
import { listTags } from "#/features/tags/api.ts";
import type { TagSummaryDTO } from "#/features/tags/types.ts";
import { createBookmark } from "../api/api";
import BookmarkForm from "../components/BookmarkForm.vue";
import type { EditableBookmarkPayload } from "../types";
import {
  chooseBookmarkCreateUrl,
  continueAfterDuplicateOrRelated,
  createInitialBookmarkPayload,
  resolveCheckedBookmarkState,
  resolveCreateBookmarkState,
  type CreateBookmarkState,
} from "./create-bookmark-flow";
import { handleCreateBookmarkSuccess } from "./create-bookmark-success";
import { diffUrls } from "./url-diff";

const route = useRoute();
const router = useRouter();
const errors = ref<FormErrors>({});
const isSaving = ref(false);
const isChecking = ref(false);
const tagSuggestions = ref<TagSummaryDTO[]>([]);
const state = ref<CreateBookmarkState>(
  resolveCreateBookmarkState({
    url: route.query.url as string | string[] | undefined,
    title: route.query.title as string | string[] | undefined,
  }),
);
const urlChoiceDiff = computed(() =>
  state.value.kind === "choose-url"
    ? diffUrls(state.value.originalUrl, state.value.cleanedUrl)
    : null,
);
const formInitialValues = computed(() =>
  state.value.kind === "create-form" ? createInitialBookmarkPayload(state.value) : undefined,
);
const formInitialFocusTarget = computed(() =>
  state.value.kind === "create-form" ? state.value.focusTarget : "url",
);

onMounted(async () => {
  const [tagsResult] = await Promise.all([listTags(), runUrlCheckIfNeeded()]);

  if (tagsResult.isOk) {
    tagSuggestions.value = tagsResult.value.tags;
  }
});

async function saveBookmark(payload: EditableBookmarkPayload) {
  isSaving.value = true;
  errors.value = {};

  const result = await createBookmark(payload);

  if (result.isOk) {
    if (state.value.kind !== "create-form") {
      await router.push("/");
    } else {
      await handleCreateBookmarkSuccess({
        closeAfterCreate: state.value.closeAfterCreate,
        closeWindow: () => window.close(),
        isWindowClosed: () => window.closed,
        navigateToList: async () => {
          await router.push("/");
        },
        wait: async (ms) => {
          await new Promise((resolve) => setTimeout(resolve, ms));
        },
      });
    }
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
  void runUrlCheckIfNeeded();
}

function chooseCleanedUrl() {
  if (state.value.kind !== "choose-url") {
    return;
  }

  state.value = chooseBookmarkCreateUrl(state.value, "cleaned");
  void runUrlCheckIfNeeded();
}

function createAnywayFromDuplicate() {
  if (state.value.kind !== "duplicate-bookmark") {
    return;
  }

  state.value = continueAfterDuplicateOrRelated(state.value);
}

function createAnywayFromRelatedLinks() {
  if (state.value.kind !== "related-link-matches") {
    return;
  }

  state.value = continueAfterDuplicateOrRelated(state.value);
}

async function runUrlCheckIfNeeded() {
  if (state.value.kind !== "checking" || isChecking.value) {
    return;
  }

  isChecking.value = true;
  errors.value = {};

  const checkingState = state.value;
  const result = await checkBookmarkUrl(checkingState.url);

  if (result.isErr) {
    state.value = {
      kind: "create-form",
      initialUrl: checkingState.url,
      initialTitle: checkingState.title,
      focusTarget: "url",
      closeAfterCreate: checkingState.closeAfterCreate,
    };
    errors.value = result.error.formErrors;
    isChecking.value = false;
    return;
  }

  const next = resolveCheckedBookmarkState(result.value, checkingState);
  if (next.kind === "redirect-edit") {
    await router.replace(`/bookmarks/${next.bookmarkId}/edit`);
    isChecking.value = false;
    return;
  }

  state.value = next;
  isChecking.value = false;
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
            class="ui-border ui-surface ui-suggestion-hover ui-text-emphasis w-full border px-4 py-4 text-left transition"
            type="button"
            @click="chooseOriginalUrl"
          >
            <p class="text-sm font-semibold">Use original URL</p>
            <p class="ui-text-muted mt-1 text-sm break-all">{{ state.originalUrl }}</p>
          </button>

          <button
            class="ui-border ui-surface ui-suggestion-hover ui-text-emphasis w-full border px-4 py-4 text-left transition"
            type="button"
            @click="chooseCleanedUrl"
          >
            <p class="text-sm font-semibold">Use cleaned URL</p>
            <p class="ui-text-muted mt-1 text-sm break-all">{{ state.cleanedUrl }}</p>
          </button>
        </div>

        <div
          v-if="
            urlChoiceDiff && (urlChoiceDiff.nonQueryChanged || urlChoiceDiff.queryDiffs.length > 0)
          "
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

      <div v-else-if="state.kind === 'checking'" class="py-6">
        <p class="ui-text-muted text-sm">Checking existing bookmarks...</p>
      </div>

      <div v-else-if="state.kind === 'duplicate-bookmark'" class="py-6">
        <div class="ui-border ui-surface border px-4 py-4">
          <p class="ui-text-emphasis text-sm font-semibold">Possible duplicate bookmark</p>
          <p class="ui-text-muted mt-2 text-sm">
            A bookmark with the same URL and alternate HTTP protocol already exists.
          </p>
          <a
            class="ui-link mt-3 block text-sm font-semibold break-all"
            :href="state.bookmark.url"
            rel="noreferrer"
            target="_blank"
          >
            {{ state.bookmark.url }}
          </a>
          <div class="mt-4 flex flex-wrap gap-3">
            <RouterLink
              class="ui-action inline-flex min-h-10 items-center justify-center px-4 text-sm font-semibold transition"
              :to="`/bookmarks/${state.bookmark.id}/edit`"
            >
              Edit existing bookmark
            </RouterLink>
            <button
              class="ui-border ui-surface ui-suggestion-hover ui-text-emphasis inline-flex min-h-10 items-center justify-center border px-4 text-sm font-semibold transition"
              type="button"
              @click="createAnywayFromDuplicate"
            >
              Create separate bookmark
            </button>
          </div>
        </div>
      </div>

      <div v-else-if="state.kind === 'related-link-matches'" class="py-6">
        <div class="ui-border ui-surface border px-4 py-4">
          <p class="ui-text-emphasis text-sm font-semibold">Related links found in bookmarks</p>
          <ul class="mt-4 space-y-3">
            <li
              v-for="bookmark in state.bookmarks"
              :key="bookmark.id"
              class="ui-border-subtle border p-3"
            >
              <RouterLink
                class="ui-link text-sm font-semibold"
                :to="`/bookmarks/${bookmark.id}/edit`"
              >
                {{ bookmark.title }}
              </RouterLink>
              <p class="ui-text-muted mt-1 text-sm break-all">{{ bookmark.url }}</p>
            </li>
          </ul>
          <button
            class="ui-border ui-surface ui-suggestion-hover ui-text-emphasis mt-4 inline-flex min-h-10 items-center justify-center border px-4 text-sm font-semibold transition"
            type="button"
            @click="createAnywayFromRelatedLinks"
          >
            Create a new bookmark anyway
          </button>
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
