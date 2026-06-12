<script setup lang="ts">
import { useRouter, useRoute } from "vue-router";
import { useAppVariants } from "#/variants.ts";
const { variants } = useAppVariants();

const router = useRouter();
const route = useRoute();

function reloadOnHome(event: MouseEvent) {
  if (route.fullPath !== "/") return;
  // Let native browser behavior handle ctrl+click, middle-click, etc.
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) return;

  event.preventDefault();
  router.go(0); // reload
}
</script>

<template>
  <header class="mb-7 flex items-center justify-between gap-4 select-none">
    <div>
      <RouterLink
        v-if="variants.showFavIcon"
        class="ui-link flex h-4 cursor-pointer items-center gap-1.25 text-xs font-bold tracking-normal uppercase"
        to="/"
        @click="reloadOnHome"
      >
        <img
          class="h-4 w-4 shrink-0"
          src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAq1BMVEUAAAAAMbEKNas9VZd9fX43UplSY48ENK4NOKwSOqxIXZNPYZArTJ0yUJsvTZsAM7IAMrEAMrL///8AM7MAH6r8/f2mtuIAK68AJq74+fyFnNkAMLIAIqwAEaYAJ7kTQrcALrUlUL3///7+/f3I0u6tvOXCzuzv8vkxWsEkSroNO7QAG6nf5fWer+B/lddsiNIvVb91j9RcdstQcslKacbP1++zweeMotuHntq/2SSvAAAAD3RSTlMA/OeDC4tZ9ePZbF+gmZi7udEeAAAB6ElEQVQ4y12TiZKbMAyGTUI2SbctlmUCWRNKQnMfmz16vP+T9ZcMdGe/YYJjfZZsjTHKeGQzwJzhrbAdjU3PwzwhmYshItK3TeYP3fK6kWkNIoGqBCFr6rGur1nCOofH9pksZaFGjnTW2C6YFR0ER1TbzFIzCVZ9y2V1+qGcSm+jYsPETAmqJPDH7X6p7HevvujKTE2AJzWq9dL951oFhAEZiSJFKC4ub91mI49r3Z8za15rECSY/g3xX8c1OL7uN607lqTb0AxQzleXu925FFaHPHc3rwtVAOQXEH6WaBIx+51z2woL4ZiMtCedwPxB0OKGYEDphYA+rdbL1j15xCWD9rDPoL06vV8wvpcaRwYYg3C+Sa8chgvPOEIULJwo/D44AY3YFQVjGpIK1AnbZ6dcXsqC9WpwZrBenE74e78fDmvygVFfUuse4PWbXClYDuLxkAEVWI+Z59vrAryIQFpiaHWmQusizxUT0O0beVtiETr0jJxxlAxHEYIcP/JWMYh3yrC1MvC3p4H3kgmCxTSEJN64cuUHKtbmaiAx3wMGgAfEF0QJX006auR/phYm+xPqdWmmqTGPdWwLx49DFVbbUv3FgEmNHF1UC2gco6b+ZpTHeSJFIqQ/0j6a6fru8w/2M6NJasA/ltpKo8JMfD0AAAAASUVORK5CYII="
          alt=""
          aria-hidden="true"
        />
        pongolinks
      </RouterLink>
      <RouterLink
        v-else
        class="ui-link block cursor-pointer text-xs font-bold tracking-normal uppercase"
        to="/"
        @click="reloadOnHome"
      >
        pongolinks
      </RouterLink>
      <RouterLink
        class="ui-text-strong mt-1 block cursor-pointer text-2xl font-bold"
        to="/"
        @click="reloadOnHome"
      >
        Bookmarks
      </RouterLink>
    </div>
    <RouterLink
      class="ui-action inline-flex min-h-10 items-center justify-center px-4 text-sm font-semibold transition"
      to="/bookmarks/new"
    >
      New bookmark
    </RouterLink>
  </header>
</template>
