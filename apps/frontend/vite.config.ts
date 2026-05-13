import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

const appBasePath = "/pongolinks";

export default defineConfig({
  base: `${appBasePath}/`,
  plugins: [tailwindcss(), vue()],
  server: {
    proxy: {
      [`${appBasePath}/api`]: "http://localhost:3000",
    },
  },
});
