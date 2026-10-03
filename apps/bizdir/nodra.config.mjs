/**
 * File-based config overrides (lower precedence than NODRA_* env vars,
 * higher precedence than the built-in defaults — see
 * packages/nodra/src/core/config.ts).
 *
 * Kept as plain .mjs, not .ts: `loadConfig()` loads this file via a raw
 * runtime `import()` (see packages/nodra/src/core/config.ts), which only
 * understands JS. A `.ts` config here would resolve fine under `vite dev`
 * but throw a syntax error under `node .output/server/index.mjs` in
 * production, since plain Node can't parse TypeScript.
 *
 * @type {import('nodra/core/config.js').NodraConfigOverride}
 */
const config = {
  installedApps: [],
};

export default config;
