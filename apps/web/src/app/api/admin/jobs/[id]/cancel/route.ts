import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import { requireAdmin, audit, AdminAuthError } from '@/lib/admin/guard';
import { firstRow } from '@/lib/admin/rows';

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { user: admin } = await requireAdmin();
    const { id } = await ctx.params;
    const r = firstRow<{ id: string; task_id: string }>(
      await db.execute(sql`
        UPDATE prediction_jobs
        SET status = 'cancelled', completed_at = NOW()
        WHERE id = ${id}::uuid
          AND status IN ('queued','running')
        RETURNING id::text AS id, task_id
      `)
    );
    if (!r) return NextResponse.json({ error: 'NOT_CANCELLABLE' }, { status: 400 });
    await audit(admin.email, 'job.cancel', 'prediction_job', id, { task_id: r.task_id });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ error: e.code }, { status: e.code === 'UNAUTHORIZED' ? 401 : 403 });
    }
    console.error(e);
    return NextResponse.json({ error: 'INTERNAL' }, { status: 500 });
  }
}
