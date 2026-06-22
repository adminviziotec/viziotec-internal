import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    rollupOptions: {
      output: {
        // Split heavy third-party libs into cacheable vendor chunks.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          // Keep recharts and its transitive deps in the lazy charts chunk so
          // they don't bloat the eagerly-loaded vendor bundle.
          if (
            id.includes("recharts") ||
            id.includes("d3-") ||
            id.includes("victory-") ||
            id.includes("react-smooth") ||
            id.includes("internmap") ||
            id.includes("node_modules/lodash")
          )
            return "charts";
          if (id.includes("@dnd-kit")) return "dnd";
          if (id.includes("framer-motion")) return "motion";
          if (id.includes("@supabase")) return "supabase";
          if (id.includes("@tanstack")) return "query";
          if (id.includes("react-router") || id.includes("@remix-run")) return "router";
          if (id.includes("@radix-ui")) return "radix";
          if (id.includes("react-hook-form") || id.includes("@hookform") || id.includes("zod"))
            return "forms";
          return "vendor";
        },
      },
    },
  },
});
