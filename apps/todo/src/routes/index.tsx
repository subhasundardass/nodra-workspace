import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', maxWidth: 640 }}>
      <h1>todo</h1>
      <p>
        A Nodra app on TanStack Start. Server functions call{' '}
        <code>app.orm</code>/<code>app.registry</code> directly — see{' '}
        <code>src/server/functions/</code>.
      </p>
      <ul>
        <li>
          <code>npm run cli --workspace=todo -- new:doctype &lt;Name&gt;</code> — scaffold a
          DocType
        </li>
        <li>
          <code>npm run cli --workspace=todo -- new:server-fn &lt;Doctype&gt;</code> —
          scaffold its server functions
        </li>
        <li>
          <code>GET /health</code>
        </li>
      </ul>
    </main>
  );
}
