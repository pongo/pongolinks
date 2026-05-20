<script setup lang="ts">
import { computed } from "vue";

import {
  formatWaybackTimestamp,
  type WaybackStatusViewModel,
} from "#/features/wayback/wayback-status.ts";

const props = defineProps<{
  status: WaybackStatusViewModel;
}>();

const formattedTimestamp = computed(() =>
  props.status.kind === "available" ? formatWaybackTimestamp(props.status.timestamp) : "",
);
</script>

<template>
  <p v-if="status.kind === 'checking'" class="ui-text-muted mt-2 text-sm">
    Checking Wayback availability...
  </p>

  <p v-else-if="status.kind === 'available'" class="ui-text-muted mt-2 text-sm">
    Archived snapshot found on {{ formattedTimestamp }}.
    <a class="ui-link font-semibold" :href="status.archivedUrl" target="_blank" rel="noopener">
      Open archived snapshot
    </a>
  </p>

  <p v-else-if="status.kind === 'unavailable'" class="ui-text-muted mt-2 text-sm">
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

  <p v-else-if="status.kind === 'error'" class="ui-danger-text mt-2 text-sm">
    {{ status.message }}
  </p>
</template>
