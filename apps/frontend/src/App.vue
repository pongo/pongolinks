<script setup lang="ts">
import { provideAppVariants } from "#/variants.ts";
const { variants } = provideAppVariants();

import { watchEffect } from "vue";
watchEffect(() => {
  document.documentElement.classList.toggle("bg-blue", variants.bgBlue);
});
</script>

<template>
  <RouterView />
</template>
