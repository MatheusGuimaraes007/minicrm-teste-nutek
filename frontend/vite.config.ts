import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/auth": {
        target: "http://localhost:8082",
        changeOrigin: true,
      },
      "/contacts": {
        target: "http://localhost:5678",
        changeOrigin: true,
        rewrite: (path) => {
          const match = path.match(/^\/contacts\/(.+)$/);
          if (match) {
            return `/webhook/contacts?contactId=${match[1]}`;
          }
          return `/webhook${path}`;
        },
      },
    },
  },
});
