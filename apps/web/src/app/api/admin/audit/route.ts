import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import { requireAdmin, AdminAuthError } from '@/lib/admin/guard';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const u = new URL(req.url);
    const actor = u.searchParams.get('actor') ?? '';
    const action = u.searchParams.get('action') ?? '';
    const from = u.searchParams.get('from') ?? '';
    const to = u.searchParams.get('to') ?? '';
    const format = u.searchParams.get('format') ?? 'json';

    const r = await db.execute(sql`
      SELECT id, actor_email, action, resource_type, resource_id, details, ip_address, created_at
      FROM audit_log
      WHERE
        (${actor} = '' OR actor_email ILIKE '%' || ${actor} || '%') AND
        (${action} = '' OR action ILIKE '%' || ${action} || '%') AND
        (${from} = '' OR created_at >= ${from}::timestamptz) AND
        (${to} = '' OR created_at <= ${to}::timestamptz)
      ORDER BY created_at DESC LIMIT 5000
    `);
    const rows = ((r as unknown as { rows?: unknown[] }).rows ?? r) as Array<Record<string, unknown>>;

    if (format === 'csv') {
      const head = ['id', 'created_at', 'actor_email', 'action', 'resource_type', 'resource_id', 'details', 'ip_address'];
      const csv = [head.join(',')];
      for (const row of rows) {
        const cell = (v: unknown) => {
          const s = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
          return `"${s.replace(/"/g, '""')}"`;
        };
        csv.push(head.map((h) => cell((row as Record<string, unknown>)[h])).join(','));
      }
      return new NextResponse(csv.join('\n'), {
        headers: {
          'content-type': 'text/csv; charset=utf-8',
          'content-disposition': `attachment; filename="audit-${Date.now()}.csv"`,
        },
      });
    }
    return NextResponse.json({ rows });
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ error: e.code }, { status: e.code === 'UNAUTHORIZED' ? 401 : 403 });
    }
    console.error(e);
    return NextResponse.json({ error: 'INTERNAL' }, { status: 500 });
  }
}
