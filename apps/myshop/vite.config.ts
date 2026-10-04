import { defineConfig } from 'vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { nitroV2Plugin } from '@tanstack/nitro-v2-vite-plugin';
import viteReact from '@vitejs/plugin-react';
import viteTsConfigPaths from 'vite-tsconfig-paths';

// Old Fastify server.config.server.{host,port} → Vite/Nitro dev & preview
// ports below. In production, host/port for `node .output/server/index.mjs`
// are read from the standard HOST / PORT env vars by the node-server preset.
//
// Note: `srcDirectory` defaults to "src" in @tanstack/react-start — no
// override needed to get routes read from apps/mfi/src/routes.
export default defineConfig({
  plugins: [
    viteTsConfigPaths({ projects: ['./tsconfig.json'] }),
    tanstackStart(),
    // 'node-server' matches what the old Fastify app effectively was: a
    // long-lived Node process you deploy yourself. Swap the preset if you
    // deploy to Vercel/Cloudflare/etc — see README.md.
    nitroV2Plugin({ preset: 'node-server', compatibilityDate: '2026-09-20' }),
    viteReact(),
  ],
  server: {
    port: Number(process.env.PORT ?? 3000),
  },
});
