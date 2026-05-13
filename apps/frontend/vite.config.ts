import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

const appBasePath = "/pongolinks";

export default defineConfig({
  base: `${appBasePath}/`,
  plugins: [vue()],
  server: {
    proxy: {
      [`${appBasePath}/api`]: "http://localhost:3000",
    },
  },
});
