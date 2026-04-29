import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import { requireAdmin, AdminAuthError } from '@/lib/admin/guard';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    await requireAdmin();
    const r = await db.execute(sql`
      SELECT id::text, event_type, payment_id::text, signature_valid::text,
             processed_at, processing_error, created_at
      FROM payment_webhook_logs
      ORDER BY created_at DESC LIMIT 1000
    `);
    return NextResponse.json({ rows: (r as unknown as { rows?: unknown[] }).rows ?? r });
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ error: e.code }, { status: e.code === 'UNAUTHORIZED' ? 401 : 403 });
    }
    return NextResponse.json({ error: 'INTERNAL' }, { status: 500 });
  }
}
