<script setup lang="ts">
import { RouterLink } from "vue-router";

import TagsListPanel from "../components/TagsListPanel.vue";
import UntaggedBookmarksPanel from "../components/UntaggedBookmarksPanel.vue";
</script>

<template>
  <main class="ui-page-text min-h-screen px-4 py-8 sm:px-6">
    <section class="mx-auto max-w-3xl">
      <header class="mb-6">
        <RouterLink class="ui-link text-sm font-semibold" to="/">Back to bookmarks</RouterLink>
        <h1 class="ui-text-strong mt-5 text-2xl font-bold">Tags</h1>
      </header>

      <UntaggedBookmarksPanel />
      <TagsListPanel />
    </section>
  </main>
</template>
