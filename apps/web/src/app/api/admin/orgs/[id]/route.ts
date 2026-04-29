import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import { requireAdmin, audit, AdminAuthError } from '@/lib/admin/guard';
import { firstRow, rowsOf } from '@/lib/admin/rows';

export const dynamic = 'force-dynamic';

function err(e: unknown) {
  if (e instanceof AdminAuthError) {
    return NextResponse.json({ error: e.code }, { status: e.code === 'UNAUTHORIZED' ? 401 : 403 });
  }
  console.error(e);
  return NextResponse.json({ error: 'INTERNAL' }, { status: 500 });
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const [org, members, txns] = await Promise.all([
      db.execute(sql`SELECT *, COALESCE(status,'active') AS status FROM organizations WHERE id = ${id}`),
      db.execute(sql`
        SELECT om.role, u.email, u.name, om.created_at
        FROM organization_members om JOIN users u ON u.id = om.user_id
        WHERE om.organization_id = ${id} ORDER BY om.created_at LIMIT 200
      `),
      db.execute(sql`
        SELECT id::text, amount::text, status::text, created_at
        FROM payments WHERE metadata->>'organization_id' = ${id}
        ORDER BY created_at DESC LIMIT 50
      `).catch(() => ({ rows: [] })),
    ]);
    return NextResponse.json({
      org: firstRow(org),
      members: rowsOf(members),
      transactions: rowsOf(txns),
    });
  } catch (e) {
    return err(e);
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { user: admin } = await requireAdmin();
    const { id } = await ctx.params;
    const body = (await req.json()) as {
      op: 'topupPayg' | 'suspend' | 'unsuspend' | 'transferOwner';
      amountRub?: number;
      reason?: string;
      newOwnerEmail?: string;
    };

    switch (body.op) {
      case 'topupPayg': {
        if (typeof body.amountRub !== 'number') {
          return NextResponse.json({ error: 'BAD_AMOUNT' }, { status: 400 });
        }
        await db.execute(sql`
          UPDATE organizations SET payg_credits = payg_credits + ${body.amountRub} WHERE id = ${id}
        `);
        await audit(admin.email, 'org.topup_payg', 'org', id, {
          delta: body.amountRub,
          reason: body.reason,
        });
        break;
      }
      case 'suspend': {
        await db.execute(sql`UPDATE organizations SET status = 'suspended' WHERE id = ${id}`);
        await audit(admin.email, 'org.suspend', 'org', id, { reason: body.reason });
        break;
      }
      case 'unsuspend': {
        await db.execute(sql`UPDATE organizations SET status = 'active' WHERE id = ${id}`);
        await audit(admin.email, 'org.unsuspend', 'org', id, {});
        break;
      }
      case 'transferOwner': {
        if (!body.newOwnerEmail) {
          return NextResponse.json({ error: 'BAD_EMAIL' }, { status: 400 });
        }
        await db.execute(sql`
          UPDATE organizations SET owner_id = (SELECT id FROM users WHERE email = ${body.newOwnerEmail})
          WHERE id = ${id}
        `);
        await audit(admin.email, 'org.transfer_owner', 'org', id, { newOwner: body.newOwnerEmail });
        break;
      }
      default:
        return NextResponse.json({ error: 'UNKNOWN_OP' }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return err(e);
  }
}
