<script setup lang="ts">
import { onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

import { buildTagShortcutReplaceTarget } from "./bookmark-list-query-state";

const route = useRoute();
const router = useRouter();

onMounted(async () => {
  const rawTags = typeof route.params.tags === "string" ? route.params.tags : "";
  let decoded = rawTags;
  try {
    decoded = decodeURIComponent(rawTags);
  } catch {
    decoded = rawTags;
  }

  await router.replace(buildTagShortcutReplaceTarget(decoded));
});
</script>

<template>
  <main class="ui-page-text min-h-screen px-4 py-8 sm:px-6">
    <section class="mx-auto max-w-3xl">
      <p class="ui-text-muted text-sm">Redirecting to bookmarks…</p>
    </section>
  </main>
</template>
