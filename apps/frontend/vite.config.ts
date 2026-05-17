import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { APP_BASE_PATH_WITH_TRAILING_SLASH, APP_BASE_PATH } from "@pongolinks/shared/app-config";
import { defineConfig } from "vite";

export default defineConfig({
  base: APP_BASE_PATH_WITH_TRAILING_SLASH,
  plugins: [tailwindcss(), vue()],
  server: {
    proxy: {
      [`${APP_BASE_PATH}/api`]: "http://localhost:3000",
    },
  },
});
