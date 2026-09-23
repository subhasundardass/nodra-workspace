/**
 * Whitelisted server methods, callable via POST /api/method/:methodPath
 * (see app/routes/api/method/$methodPath.ts).
 *
 * `MethodRegistry` (src/api/method.ts) was already framework-agnostic — it
 * never depended on Fastify — so it's reused unchanged. This file is just
 * the registration point that `NodraApp.create()` calls once at boot.
 * Add your app's business-logic methods here, e.g.:
 *
 *   registry.register('crm.get_pipeline_summary', async (args) => {
 *     const app = await getNodra();
 *     return app.orm.getList('Opportunity', { ... });
 *   }, { requireAuth: true, requiredRoles: ['Sales Manager'] });
 */
import type { MethodRegistry } from 'nodra/api/method.js';

export function registerAppMethods(registry: MethodRegistry): void {
  registry.register(
    'ping',
    () => ({ pong: true, time: new Date().toISOString() }),
    { requireAuth: false },
  );
}
