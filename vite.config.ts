import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  base: "/fire-calculator/",
  server: {
    port: 3000,
    open: true,
  },
  build: {
    sourcemap: true,
  },
  test: {
    environment: "node",
    include: ["src/__tests__/**/*.test.ts"],
  },
});
