import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

/**
 * Exported name is load-bearing: the framework's virtual router-entry
 * module re-exports whatever this file calls `getRouter` (verified against
 * the installed @tanstack/start-client-core — its fake-entries/router.d.ts
 * literally declares `export declare function getRouter(): void;` as the
 * contract this file must satisfy). An export named `createRouter` here
 * builds fine but fails at bundle time with a "getRouter is not exported"
 * error.
 */
export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
  });

  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
