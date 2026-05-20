<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

import { checkWaybackAvailability } from "#/features/bookmark-editor/components/BookmarkForm/wayback/api.ts";
import type { ApiError } from "#/shared/api/errors.ts";
import {
  formatWaybackTimestamp,
  toWaybackStatusViewModel,
  type WaybackStatusViewModel,
} from "#/features/bookmark-editor/components/BookmarkForm/wayback/wayback-status.ts";
import type { WaybackAvailabilityDTO } from "#/features/bookmark-editor/components/BookmarkForm/wayback/types.ts";
import type { Result } from "@pongolinks/shared/result";

const props = defineProps<{
  url?: string;
  status?: WaybackStatusViewModel;
  check?: (url: string) => Promise<Result<WaybackAvailabilityDTO, ApiError>>;
}>();

const internalStatus = ref<WaybackStatusViewModel>({ kind: "idle" });
const initialUrl = (props.url ?? "").trim();
let isActive = true;
const hasEditedInitialUrl = computed(() => (props.url ?? "").trim() !== initialUrl);
const displayStatus = computed<WaybackStatusViewModel>(() => {
  if (props.status) {
    return props.status;
  }

  return hasEditedInitialUrl.value ? { kind: "idle" } : internalStatus.value;
});

const formattedTimestamp = computed(() =>
  displayStatus.value.kind === "available"
    ? formatWaybackTimestamp(displayStatus.value.timestamp)
    : "",
);
const browseWaybackHref = computed(() => {
  const normalizedUrl = (props.url ?? "").trim();
  if (!isCheckableBookmarkUrl(normalizedUrl)) {
    return "https://web.archive.org/web/";
  }

  return `https://web.archive.org/web/${normalizedUrl}`;
});

function isCheckableBookmarkUrl(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed === "") {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

onMounted(async () => {
  if (props.status || !isCheckableBookmarkUrl(initialUrl)) {
    return;
  }

  internalStatus.value = { kind: "checking" };
  const check = props.check ?? checkWaybackAvailability;
  const result = await check(initialUrl);
  if (!isActive || hasEditedInitialUrl.value) {
    return;
  }

  internalStatus.value = result.isOk
    ? toWaybackStatusViewModel(result.value)
    : { kind: "error", message: "Could not check Wayback availability right now." };
});

onBeforeUnmount(() => {
  isActive = false;
});
</script>

<template>
  <p v-if="displayStatus.kind === 'checking'" class="ui-text-muted mt-2 text-sm">
    Checking Wayback availability...
  </p>

  <p v-else-if="displayStatus.kind === 'available'" class="ui-text-muted mt-2 text-sm">
    Archived snapshot found on
    <a
      class="ui-link font-semibold"
      :href="displayStatus.archivedUrl"
      target="_blank"
      rel="noopener"
    >
      {{ formattedTimestamp }}
    </a>
  </p>

  <p v-else-if="displayStatus.kind === 'unavailable'" class="ui-text-muted mt-2 text-sm">
    No Wayback snapshot found for this URL.
    <a class="ui-link font-semibold" :href="browseWaybackHref" target="_blank" rel="noopener">
      Browse Wayback
    </a>
  </p>

  <p v-else-if="displayStatus.kind === 'error'" class="ui-danger-text mt-2 text-sm">
    {{ displayStatus.message }}
  </p>
</template>
