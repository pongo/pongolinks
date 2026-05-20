<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";

import { checkWaybackAvailability } from "#/features/wayback/api.ts";
import type { ApiError } from "#/shared/api/errors.ts";
import {
  formatWaybackTimestamp,
  toWaybackStatusViewModel,
  type WaybackStatusViewModel,
} from "#/features/wayback/wayback-status.ts";
import type { WaybackAvailabilityDTO } from "#/features/wayback/types.ts";
import type { Result } from "@pongolinks/shared/result";

const props = defineProps<{
  url?: string;
  initialCheckUrl?: string;
  status?: WaybackStatusViewModel;
  check?: (url: string) => Promise<Result<WaybackAvailabilityDTO, ApiError>>;
}>();

const internalStatus = ref<WaybackStatusViewModel>({ kind: "idle" });
const displayStatus = computed(() => props.status ?? internalStatus.value);

let waybackRequestId = 0;
let waybackDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let checkTargetUrl: string | null = null;
let hasStartedCheck = false;
let hideStatusAfterUrlEdit = false;

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

watch(
  () => [props.initialCheckUrl ?? "", props.url ?? "", props.status] as const,
  ([initialCheckUrlValue, currentUrlValue]) => {
    if (props.status) {
      return;
    }

    const normalizedInitialCheckUrl = initialCheckUrlValue.trim();
    const normalizedCurrentUrl = currentUrlValue.trim();
    waybackRequestId += 1;
    const requestId = waybackRequestId;

    if (waybackDebounceTimer) {
      clearTimeout(waybackDebounceTimer);
      waybackDebounceTimer = null;
    }

    if (
      checkTargetUrl === null &&
      normalizedInitialCheckUrl !== "" &&
      isCheckableBookmarkUrl(normalizedInitialCheckUrl)
    ) {
      checkTargetUrl = normalizedInitialCheckUrl;
    }

    if (!checkTargetUrl) {
      internalStatus.value = { kind: "idle" };
      return;
    }

    if (normalizedCurrentUrl !== checkTargetUrl) {
      hideStatusAfterUrlEdit = true;
      internalStatus.value = { kind: "idle" };
      return;
    }

    if (hideStatusAfterUrlEdit || hasStartedCheck) {
      return;
    }

    hasStartedCheck = true;
    internalStatus.value = { kind: "checking" };
    waybackDebounceTimer = setTimeout(async () => {
      const check = props.check ?? checkWaybackAvailability;
      const result = await check(checkTargetUrl!);
      if (requestId !== waybackRequestId || hideStatusAfterUrlEdit) {
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
    <a class="ui-link font-semibold" :href="browseWaybackHref" target="_blank" rel="noopener">
      Browse Wayback
    </a>
  </p>

  <p v-else-if="displayStatus.kind === 'error'" class="ui-danger-text mt-2 text-sm">
    {{ displayStatus.message }}
  </p>
</template>
