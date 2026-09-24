import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitroV2Plugin } from "@tanstack/nitro-v2-vite-plugin";
import viteReact from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    tanstackStart(),

    nitroV2Plugin({
      preset: "node-server",
      compatibilityDate: "2026-09-20",
    }),

    viteReact(),
  ],

  resolve: {
    tsconfigPaths: true,
  },

  server: {
    port: Number(process.env.PORT ?? 3000),
  },
});
