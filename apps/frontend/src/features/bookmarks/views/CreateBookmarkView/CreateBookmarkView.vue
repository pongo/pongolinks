<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";

import type { FormErrors } from "#/shared/api/errors.ts";
import { checkBookmarkUrl } from "#/features/search/api.ts";
import { listTags } from "#/features/tags/api.ts";
import type { TagSummaryDTO } from "#/features/tags/types.ts";
import { createBookmark } from "../../api/api";
import BookmarkForm from "../../components/BookmarkForm.vue";
import type { EditableBookmarkPayload } from "../../types";
import {
  chooseBookmarkCreateUrl,
  continueAfterDuplicateOrRelated,
  createInitialBookmarkPayload,
  resolveCheckedBookmarkState,
  resolveCreateBookmarkState,
  type CreateBookmarkState,
} from "./create-bookmark-flow.ts";
import { handleCreateBookmarkSuccess } from "./create-bookmark-success.ts";
import { diffUrls } from "./url-diff.ts";
import CreateBookmarkCheckingPanel from "./CreateBookmarkCheckingPanel.vue";
import CreateBookmarkDuplicatePanel from "./CreateBookmarkDuplicatePanel.vue";
import CreateBookmarkRelatedLinksPanel from "./CreateBookmarkRelatedLinksPanel.vue";
import CreateBookmarkUrlChoicePanel from "./CreateBookmarkUrlChoicePanel.vue";

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
      <RouterLink class="ui-link text-sm font-semibold" to="/"> Back to bookmarks</RouterLink>
      <h1 class="ui-text-strong mt-5 text-2xl font-bold">New bookmark</h1>

      <CreateBookmarkUrlChoicePanel
        v-if="state.kind === 'choose-url'"
        :cleaned-url="state.cleanedUrl"
        :original-url="state.originalUrl"
        :url-choice-diff="urlChoiceDiff"
        @choose-cleaned="chooseCleanedUrl"
        @choose-original="chooseOriginalUrl"
      />

      <CreateBookmarkCheckingPanel v-else-if="state.kind === 'checking'" />

      <CreateBookmarkDuplicatePanel
        v-else-if="state.kind === 'duplicate-bookmark'"
        :bookmark="state.bookmark"
        @create-anyway="createAnywayFromDuplicate"
      />

      <CreateBookmarkRelatedLinksPanel
        v-else-if="state.kind === 'related-link-matches'"
        :bookmarks="state.bookmarks"
        @create-anyway="createAnywayFromRelatedLinks"
      />

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
