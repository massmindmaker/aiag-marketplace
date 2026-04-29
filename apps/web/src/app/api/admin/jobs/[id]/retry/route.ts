import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import { requireAdmin, audit, AdminAuthError } from '@/lib/admin/guard';
import { firstRow } from '@/lib/admin/rows';

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { user: admin } = await requireAdmin();
    const { id } = await ctx.params;
    const r = firstRow<{ id: string; status: string; task_id: string }>(
      await db.execute(sql`
        UPDATE prediction_jobs
        SET status = 'queued', error_message = NULL
        WHERE id = ${id}::uuid
          AND status IN ('failed','timeout','cancelled')
        RETURNING id::text AS id, status, task_id
      `)
    );
    if (!r) return NextResponse.json({ error: 'NOT_RETRYABLE' }, { status: 400 });
    await audit(admin.email, 'job.retry', 'prediction_job', id, { task_id: r.task_id });
    return NextResponse.json({ ok: true, status: r.status });
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ error: e.code }, { status: e.code === 'UNAUTHORIZED' ? 401 : 403 });
    }
    console.error(e);
    return NextResponse.json({ error: 'INTERNAL' }, { status: 500 });
  }
}
