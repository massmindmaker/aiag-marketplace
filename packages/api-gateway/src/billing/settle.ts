/**
 * Thin wrapper around the `aiag_settle_charge` stored function.
 *
 * FIX C2: No pre-check SELECT. Idempotency is handled INSIDE the stored
 * function (SELECT FOR UPDATE + existing api_usage lookup). Wrapper purely
 * translates Postgres error codes to AiagError instances.
 */
import { sql as defaultSql } from '../lib/db';
import { errors } from '../lib/errors';

export type SettleArgs = {
  orgId: string;
  requestId: string;
  totalRub: number;
};

export type SettleResult = {
  subPortion: number;
  paygPortion: number;
  newSub: number;
  newPayg: number;
  idempotent: boolean;
};

/**
 * Accepts an injectable sql client to simplify testing.
 */
export async function settleCharge(
  args: SettleArgs,
  client: typeof defaultSql = defaultSql
): Promise<SettleResult> {
  try {
    const rows = await client<
      Array<{
        sub_portion: string;
        payg_portion: string;
        new_sub: string;
        new_payg: string;
        idempotent: boolean;
      }>
    >`
      SELECT sub_portion, payg_portion, new_sub, new_payg, idempotent
      FROM aiag_settle_charge(${args.orgId}::uuid, ${args.requestId}, ${args.totalRub}::numeric)
    `;
    const row = rows[0];
    if (!row) throw errors.unavailable('aiag_settle_charge returned no row');
    return {
      subPortion: Number(row.sub_portion),
      paygPortion: Number(row.payg_portion),
      newSub: Number(row.new_sub),
      newPayg: Number(row.new_payg),
      idempotent: Boolean(row.idempotent),
    };
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === 'P0001') throw errors.badRequest('Invalid amount');
    if (code === 'P0002') throw errors.badRequest('Unknown organization');
    if (code === 'P0003') throw errors.paymentRequired();
    if (code === 'P0004') throw errors.unavailable('Concurrent modification');
    throw e;
  }
}
