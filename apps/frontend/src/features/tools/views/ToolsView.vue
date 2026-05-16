<script setup lang="ts">
import { RouterLink } from "vue-router";

import { createBookmarkletHref } from "../bookmarklet";

const bookmarkletHref = createBookmarkletHref({
  appBasePath: import.meta.env.BASE_URL,
  appOrigin: window.location.origin,
});
</script>

<template>
  <main class="ui-page-text min-h-screen px-4 py-8 sm:px-6">
    <section class="mx-auto max-w-3xl">
      <RouterLink class="ui-link text-sm font-semibold" to="/"> Back to bookmarks </RouterLink>
      <h1 class="ui-text-strong mt-5 text-2xl font-bold">Tools</h1>
      <p class="ui-text-muted mt-2 text-sm">Drag this bookmarklet to your browser bookmarks bar.</p>

      <div class="ui-border ui-surface mt-6 border px-5 py-5">
        <p class="ui-text-emphasis text-sm font-semibold">Bookmarklet</p>
        <a
          class="ui-action mt-3 inline-flex min-h-10 items-center justify-center px-4 text-sm font-semibold transition select-none"
          :href="bookmarkletHref"
        >
          PL
        </a>
      </div>
    </section>
  </main>
</template>
