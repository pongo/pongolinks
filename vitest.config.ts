import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        resolve: {
          alias: {
            "@": fileURLToPath(new URL("./apps/backend/src", import.meta.url)),
          },
        },
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
    ],
  },
});
