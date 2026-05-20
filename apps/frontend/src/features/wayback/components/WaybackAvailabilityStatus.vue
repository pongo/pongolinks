<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";

import { checkWaybackAvailability } from "#/features/wayback/api.ts";
import {
  formatWaybackTimestamp,
  toWaybackStatusViewModel,
  type WaybackStatusViewModel,
} from "#/features/wayback/wayback-status.ts";

const props = defineProps<{
  url?: string;
  status?: WaybackStatusViewModel;
}>();

const internalStatus = ref<WaybackStatusViewModel>({ kind: "idle" });
const displayStatus = computed(() => props.status ?? internalStatus.value);

let waybackRequestId = 0;
let waybackDebounceTimer: ReturnType<typeof setTimeout> | null = null;

const formattedTimestamp = computed(() =>
  displayStatus.value.kind === "available"
    ? formatWaybackTimestamp(displayStatus.value.timestamp)
    : "",
);

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

watch(
  () => props.url ?? "",
  (urlValue) => {
    if (props.status) {
      return;
    }

    const normalizedUrl = urlValue.trim();
    waybackRequestId += 1;
    const requestId = waybackRequestId;

    if (waybackDebounceTimer) {
      clearTimeout(waybackDebounceTimer);
      waybackDebounceTimer = null;
    }

    if (!isCheckableBookmarkUrl(normalizedUrl)) {
      internalStatus.value = { kind: "idle" };
      return;
    }

    internalStatus.value = { kind: "checking" };
    waybackDebounceTimer = setTimeout(async () => {
      const result = await checkWaybackAvailability(normalizedUrl);
      if (requestId !== waybackRequestId) {
        return;
      }

      internalStatus.value = result.isOk
        ? toWaybackStatusViewModel(result.value)
        : { kind: "error", message: "Could not check Wayback availability right now." };
    }, 350);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (waybackDebounceTimer) {
    clearTimeout(waybackDebounceTimer);
  }
});
</script>

<template>
  <p v-if="displayStatus.kind === 'checking'" class="ui-text-muted mt-2 text-sm">
    Checking Wayback availability...
  </p>

  <p v-else-if="displayStatus.kind === 'available'" class="ui-text-muted mt-2 text-sm">
    Archived snapshot found on {{ formattedTimestamp }}.
    <a
      class="ui-link font-semibold"
      :href="displayStatus.archivedUrl"
      target="_blank"
      rel="noopener"
    >
      Open archived snapshot
    </a>
  </p>

  <p v-else-if="displayStatus.kind === 'unavailable'" class="ui-text-muted mt-2 text-sm">
    No Wayback snapshot found for this URL.
    <a
      class="ui-link font-semibold"
      href="https://web.archive.org/web/"
      target="_blank"
      rel="noopener"
    >
      Browse Wayback
    </a>
  </p>

  <p v-else-if="displayStatus.kind === 'error'" class="ui-danger-text mt-2 text-sm">
    {{ displayStatus.message }}
  </p>
</template>
