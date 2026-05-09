import { createRouter, createWebHistory } from "vue-router";

import { HealthShell } from "@/features/health";

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HealthShell,
    },
  ],
});
