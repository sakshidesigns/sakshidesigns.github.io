import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    // Vitest stubs CSS files to "" by default; these tests need the real text
    // of these two files to pin rules that cannot be checked in jsdom.
    css: { include: [/src\/index\.css/, /src\/sections\/sections\.css/] },
    globals: true,
  },
});
