import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  test: {
    silent: "passed-only",
    projects: [
      {
        test: {
          name: "@pongolinks/backend",
          root: "./apps/backend",
        },
      },
      {
        test: {
          name: "@pongolinks/db",
          root: "./packages/db",
        },
      },
      {
        plugins: [vue()],
        test: {
          name: "@pongolinks/frontend",
          root: "./apps/frontend",
          environment: "happy-dom",
        },
      },
      {
        test: {
          name: "@pongolinks/shared",
          root: "./packages/shared",
        },
      },
    ],
  },
});
