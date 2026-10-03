/**
 * GET /health — DB connectivity check.
 *
 * Kept as a real server route (not a server function): monitoring/uptime
 * tools need a stable, directly-hittable URL, not a server function's
 * internal call endpoint. Uses the raw Response/Web API directly since the
 * old json() helper (built for the REST layer) was removed along with it.
 */
import { createFileRoute } from '@tanstack/react-router';
import { getNodra } from '../server/nodra-app.js';

export const Route = createFileRoute('/health')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const app = await getNodra();
          await app.db.query('SELECT 1');
          return Response.json({ status: 'ok' });
        } catch (err) {
          console.error({ err }, 'Health check failed');
          return Response.json({ status: 'unhealthy' }, { status: 503 });
        }
      },
    },
  },
});
