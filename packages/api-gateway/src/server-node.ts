/**
 * Node.js entry point for Hono gateway.
 *
 * The default `server.ts` exports a Bun.serve-compatible config object
 * (`{ port, fetch, idleTimeout }`). On Bun runtime, that auto-starts.
 * On Node, we need an adapter — @hono/node-server.
 *
 * This file is the production entry on Node-based VPS deployments where
 * pm2 doesn't play well with bun's child process model (immediate SIGINT).
 */
import { serve } from '@hono/node-server';
import { app } from './server';

const port = parseInt(process.env.PORT || '4000', 10);

serve({ fetch: app.fetch, port }, (info) => {
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      level: 30,
      svc: 'gateway',
      msg: 'listening',
      port: info.port,
      addr: info.address,
    })
  );
});
