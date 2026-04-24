/** GET /v1/balance — returns current subscription + payg credit amounts. */
import { Hono } from 'hono';
import { sql } from '../../lib/db';
import { errors } from '../../lib/errors';

export const balance = new Hono();

balance.get('/', async (c) => {
  const orgId = c.get('orgId' as never) as string;
  const rows = await sql<
    Array<{
      subscription_credits: string;
      payg_credits: string;
      subscription_credits_expires_at: string | null;
    }>
  >`
    SELECT subscription_credits, payg_credits, subscription_credits_expires_at
      FROM organizations WHERE id = ${orgId}::uuid
  `;
  const row = rows[0];
  if (!row) throw errors.notFound('organization');
  return c.json({
    subscription_rub: Number(row.subscription_credits),
    payg_rub: Number(row.payg_credits),
    subscription_expires_at: row.subscription_credits_expires_at,
    total_rub:
      Number(row.subscription_credits) + Number(row.payg_credits),
  });
});
