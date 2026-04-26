/** GET /v1/models — list canonical catalog. */
import { Hono } from 'hono';
import { sql } from '../../lib/db';

export const models = new Hono();

models.get('/', async (c) => {
  const rows = await sql<
    Array<{ slug: string; type: string; created: number }>
  >`
    SELECT slug, type, EXTRACT(epoch FROM created_at)::int AS created
      FROM models
     WHERE enabled = TRUE
     ORDER BY slug
  `;
  return c.json({
    object: 'list',
    data: rows.map((r) => ({
      id: r.slug,
      object: 'model',
      type: r.type,
      created: r.created,
      owned_by: 'aiag',
    })),
  });
});
