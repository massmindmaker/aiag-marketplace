import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import { requireAdmin, audit, AdminAuthError } from '@/lib/admin/guard';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { user: admin } = await requireAdmin();
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => ({}))) as { resolve?: boolean };

    if (body.resolve) {
      await db.execute(sql`
        UPDATE payment_webhook_logs
        SET processed_at = NOW(), processing_error = NULL
        WHERE id = ${id}
      `);
      await audit(admin.email, 'webhook.resolve', 'webhook', id, {});
      return NextResponse.json({ ok: true, resolved: true });
    }

    // Mark for retry — clear processed_at so worker picks it up; in absence of
    // a queue worker we just bump and clear error.
    await db.execute(sql`
      UPDATE payment_webhook_logs
      SET processed_at = NULL, processing_error = 'queued for retry'
      WHERE id = ${id}
    `);
    await audit(admin.email, 'webhook.retry', 'webhook', id, {});
    return NextResponse.json({ ok: true, queued: true });
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ error: e.code }, { status: e.code === 'UNAUTHORIZED' ? 401 : 403 });
    }
    console.error(e);
    return NextResponse.json({ error: 'INTERNAL' }, { status: 500 });
  }
}
