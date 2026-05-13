<script setup lang="ts">
import { onMounted, ref } from "vue";

import { api } from "#/features/health/api.ts";

type HealthState = "checking" | "ok" | "error";

const healthState = ref<HealthState>("checking");

onMounted(async () => {
  const { data, error } = await api.api.health.get();

  healthState.value = !error && data?.status === "ok" ? "ok" : "error";
});
</script>

<template>
  <main class="shell" aria-labelledby="app-title">
    <section class="workspace">
      <p class="eyebrow">Personal bookmark library</p>
      <h1 id="app-title">pongolinks</h1>
      <p class="status" :data-state="healthState">Backend health: {{ healthState }}</p>
    </section>
  </main>
</template>

<style scoped>
.shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #f5f8fc;
  color: #202124;
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

.workspace {
  width: min(100% - 32px, 680px);
}

.eyebrow {
  margin: 0 0 12px;
  color: #1e40af;
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: clamp(2.5rem, 10vw, 5rem);
  line-height: 0.95;
}

.status {
  margin: 28px 0 0;
  font-size: 1rem;
  font-weight: 700;
}

.status[data-state="ok"] {
  color: #1d4ed8;
}

.status[data-state="error"] {
  color: #a33d2b;
}
</style>
