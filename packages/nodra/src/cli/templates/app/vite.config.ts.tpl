import path from "node:path";
import { defineConfig } from "vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitroV2Plugin } from "@tanstack/nitro-v2-vite-plugin";
import viteReact from "@vitejs/plugin-react";
import viteTsConfigPaths from "vite-tsconfig-paths";

const nodraSrc = path.resolve("../../packages/nodra/src");

export default defineConfig({
  plugins: [
    viteTsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    tanstackStart(),
    nitroV2Plugin({
      preset: "node-server",
      compatibilityDate: "2026-09-20",
    }),
    viteReact(),
  ],

  resolve: {
    alias: [
      {
        find: /^nodra\/(.+)\.js$/,
        replacement: `${nodraSrc}/$1.ts`,
      },
      {
        find: "nodra",
        replacement: `${nodraSrc}/index.ts`,
      },
    ],
  },

  server: {
    port: Number(process.env.PORT ?? 3000),
  },
});