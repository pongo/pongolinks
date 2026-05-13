import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
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
        test: {
          name: "@pongolinks/shared",
          root: "./packages/shared",
        },
      },
    ],
  },
});
