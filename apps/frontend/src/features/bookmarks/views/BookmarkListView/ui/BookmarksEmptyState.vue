<script setup lang="ts">
type Variant = "no-match" | "no-bookmarks" | "no-page";

interface EmptyStateContent {
  title: string;
  description: string;
}

defineProps<{
  variant: Variant;
}>();

const content: Record<Variant, EmptyStateContent> = {
  "no-match": {
    title: "No matching bookmarks",
    description: "Try another search or clear filters.",
  },
  "no-bookmarks": {
    title: "No bookmarks yet",
    description: "Save the first link you want to keep close.",
  },
  "no-page": {
    title: "No bookmarks on this page",
    description: "Choose another page to continue browsing saved links.",
  },
};
</script>

<template>
  <div>
    <h2 class="ui-text-strong text-lg font-semibold">
      {{ content[variant].title }}
    </h2>
    <p class="ui-text-muted mt-2 text-sm">
      {{ content[variant].description }}
    </p>
  </div>
</template>
