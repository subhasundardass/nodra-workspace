import path from "node:path";
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitroV2Plugin } from "@tanstack/nitro-v2-vite-plugin";
import viteReact from "@vitejs/plugin-react";
import viteTsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    viteTsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart(),
    nitroV2Plugin({
      preset: "node-server",
      compatibilityDate: "2026-09-20",
    }),
    viteReact(),
  ],

  resolve: {
    alias: {
      nodra: path.resolve("../../packages/nodra/src"),
    },
  },

  server: {
    port: Number(process.env.PORT ?? 3000),
  },
});
