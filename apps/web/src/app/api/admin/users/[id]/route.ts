import { NextRequest, NextResponse } from 'next/server';
import { db, eq, sql } from '@/lib/db';
import { users } from '@aiag/database/schema';
import { requireAdmin, audit, AdminAuthError } from '@/lib/admin/guard';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const u = await db.query.users.findFirst({ where: eq(users.id, id) });
    if (!u) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

    // Recent transactions / orgs / keys
    const [orgs, txs] = await Promise.all([
      db.execute(sql`
        SELECT o.id::text, o.slug, o.name, om.role
        FROM organization_members om
        JOIN organizations o ON o.id = om.organization_id
        WHERE om.user_id = ${id}
        LIMIT 50
      `),
      db.execute(sql`
        SELECT id::text, amount::text, currency, status::text, created_at
        FROM payments WHERE user_id = ${id}
        ORDER BY created_at DESC LIMIT 20
      `),
    ]);
    return NextResponse.json({
      user: {
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        isBanned: u.isBanned,
        banReason: u.banReason,
        balance: u.balance,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
      },
      orgs: (orgs as unknown as { rows?: unknown[] }).rows ?? orgs,
      transactions: (txs as unknown as { rows?: unknown[] }).rows ?? txs,
    });
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ error: e.code }, { status: e.code === 'UNAUTHORIZED' ? 401 : 403 });
    }
    console.error(e);
    return NextResponse.json({ error: 'INTERNAL' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { user: admin } = await requireAdmin();
    const { id } = await ctx.params;
    const body = (await req.json()) as {
      op: 'ban' | 'unban' | 'adjustBalance' | 'resetPassword' | 'setRole';
      reason?: string;
      amountRub?: number;
      role?: string;
    };

    const target = await db.query.users.findFirst({ where: eq(users.id, id) });
    if (!target) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

    switch (body.op) {
      case 'ban': {
        await db
          .update(users)
          .set({ isBanned: true, banReason: body.reason ?? null })
          .where(eq(users.id, id));
        await audit(admin.email, 'user.ban', 'user', id, { reason: body.reason });
        break;
      }
      case 'unban': {
        await db
          .update(users)
          .set({ isBanned: false, banReason: null })
          .where(eq(users.id, id));
        await audit(admin.email, 'user.unban', 'user', id, {});
        break;
      }
      case 'adjustBalance': {
        if (typeof body.amountRub !== 'number' || !Number.isFinite(body.amountRub)) {
          return NextResponse.json({ error: 'BAD_AMOUNT' }, { status: 400 });
        }
        const current = Number(target.balance ?? 0);
        const next = (current + body.amountRub).toFixed(2);
        await db.update(users).set({ balance: next }).where(eq(users.id, id));
        await audit(admin.email, 'user.balance_adjust', 'user', id, {
          delta: body.amountRub,
          reason: body.reason,
          from: current,
          to: Number(next),
        });
        break;
      }
      case 'resetPassword': {
        // Best-effort: clear hash so user must use OAuth or password reset flow.
        // Real email sending is wired via @aiag/email if configured.
        await db.update(users).set({ passwordHash: null }).where(eq(users.id, id));
        await audit(admin.email, 'user.reset_password', 'user', id, {});
        break;
      }
      case 'setRole': {
        const role = body.role ?? 'user';
        if (!['user', 'developer', 'admin', 'moderator'].includes(role)) {
          return NextResponse.json({ error: 'BAD_ROLE' }, { status: 400 });
        }
        await db.execute(sql`UPDATE users SET role = ${role}::user_role WHERE id = ${id}`);
        await audit(admin.email, 'user.set_role', 'user', id, { role });
        break;
      }
      default:
        return NextResponse.json({ error: 'UNKNOWN_OP' }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ error: e.code }, { status: e.code === 'UNAUTHORIZED' ? 401 : 403 });
    }
    console.error(e);
    return NextResponse.json({ error: 'INTERNAL' }, { status: 500 });
  }
}
