import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command }) => ({
  plugins: [react()],
  resolve: {
    alias: command === "serve" ? {
      "@capacitor-community/background-geolocation": path.resolve(
        __dirname,
        "src/stubs/background-geolocation.js"
      ),
    } : {},
  },
  build: {
    rollupOptions: {
      external: ["@capacitor-community/background-geolocation"],
    },
  },
  server: {
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
}));
