import { createRouter, createWebHistory } from "vue-router";

import { HealthShell } from "@/features/health";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "home",
      component: HealthShell,
    },
  ],
});
