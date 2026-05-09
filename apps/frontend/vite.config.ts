import vue from "@vitejs/plugin-vue";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const appBasePath = "/pongolinks";

export default defineConfig({
  base: `${appBasePath}/`,
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    proxy: {
      [`${appBasePath}/api`]: "http://localhost:3000",
    },
  },
});
