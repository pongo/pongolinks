<script setup lang="ts">
import type { UrlDiffSummary } from "./url-diff.ts";

defineProps<{
  originalUrl: string;
  cleanedUrl: string;
  urlChoiceDiff: UrlDiffSummary | null;
}>();

const emit = defineEmits<{
  chooseOriginal: [];
  chooseCleaned: [];
}>();
</script>

<template>
  <div class="py-6">
    <p class="ui-text-muted text-sm">
      We found a cleaned version of this URL. Choose which one to continue with.
    </p>

    <div class="mt-4 grid gap-4">
      <button
        class="ui-border ui-surface ui-suggestion-hover ui-text-emphasis w-full border px-4 py-4 text-left transition"
        type="button"
        @click="emit('chooseOriginal')"
      >
        <p class="text-sm font-semibold">Use original URL</p>
        <p class="ui-text-muted mt-1 text-sm break-all">{{ originalUrl }}</p>
      </button>

      <button
        class="ui-border ui-surface ui-suggestion-hover ui-text-emphasis w-full border px-4 py-4 text-left transition"
        type="button"
        @click="emit('chooseCleaned')"
      >
        <p class="text-sm font-semibold">Use cleaned URL</p>
        <p class="ui-text-muted mt-1 text-sm break-all">{{ cleanedUrl }}</p>
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
</template>
