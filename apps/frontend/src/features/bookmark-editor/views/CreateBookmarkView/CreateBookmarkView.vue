<script setup lang="ts">
import { onMounted } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";

import { listTags } from "#/features/tags/api.ts";
import { createBookmark } from "#/features/bookmark-editor/api.ts";
import { invalidateBookmarkUrlCheckCache } from "#/features/bookmark-editor/url-check-cache.ts";
import BookmarkForm from "../../components/BookmarkForm/BookmarkForm.vue";
import { useCreateBookmarkFlow } from "./create-bookmark-flow.ts";
import CreateBookmarkCheckingPanel from "./ui/CreateBookmarkCheckingPanel.vue";
import CreateBookmarkDuplicatePanel from "./ui/CreateBookmarkDuplicatePanel.vue";
import CreateBookmarkRelatedLinksPanel from "./ui/CreateBookmarkRelatedLinksPanel.vue";
import CreateBookmarkUrlChoicePanel from "./ui/CreateBookmarkUrlChoicePanel.vue";
import { checkBookmarkUrl } from "#/features/check-url/api.ts";

const route = useRoute();
const router = useRouter();

const {
  state,
  errors,
  isSaving,
  tagSuggestions,
  urlChoiceDiff,
  formInitialValues,
  formInitialFocusTarget,
  start,
  submit,
  chooseOriginalUrl,
  chooseCleanedUrl,
  createAnyway,
} = useCreateBookmarkFlow({
  query: {
    url: route.query.url as string | string[] | undefined,
    title: route.query.title as string | string[] | undefined,
  },
  checkBookmarkUrl,
  createBookmark,
  listTags,
  onBookmarkSaved: invalidateBookmarkUrlCheckCache,
  navigateToList: async () => {
    await router.push("/");
  },
  navigateToEdit: async (bookmarkId) => {
    await router.replace(`/bookmarks/${bookmarkId}/edit`);
  },
  closeWindow: () => window.close(),
  isWindowClosed: () => window.closed,
  wait: async (ms) => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  },
});

onMounted(() => {
  void start();
});
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
        @create-anyway="createAnyway"
      />

      <CreateBookmarkRelatedLinksPanel
        v-else-if="state.kind === 'related-link-matches'"
        :bookmarks="state.bookmarks"
        @create-anyway="createAnyway"
      />

      <div v-else class="py-6">
        <BookmarkForm
          :errors="errors"
          :initial-create-values="formInitialValues"
          :initial-focus-target="formInitialFocusTarget"
          :is-saving="isSaving"
          :tag-suggestions="tagSuggestions"
          submit-label="Create bookmark"
          @submit="submit"
        />
      </div>
    </section>
  </main>
</template>
