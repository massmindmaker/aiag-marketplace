import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import { requireAdmin, AdminAuthError } from '@/lib/admin/guard';
import { rowsOf } from '@/lib/admin/rows';

export const dynamic = 'force-dynamic';

const MAX_DAYS = 30;
const PAGE_SIZE = 50;

function err(e: unknown) {
  if (e instanceof AdminAuthError) {
    return NextResponse.json({ error: e.code }, { status: e.code === 'UNAUTHORIZED' ? 401 : 403 });
  }
  console.error(e);
  return NextResponse.json({ error: 'INTERNAL' }, { status: 500 });
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const sp = req.nextUrl.searchParams;
    const now = Date.now();
    const to = sp.get('to') ? new Date(sp.get('to')!) : new Date(now);
    const defaultFrom = new Date(to.getTime() - 24 * 3600_000);
    let from = sp.get('from') ? new Date(sp.get('from')!) : defaultFrom;
    const minFrom = new Date(to.getTime() - MAX_DAYS * 24 * 3600_000);
    if (from < minFrom) from = minFrom;

    const page = Math.max(0, parseInt(sp.get('page') ?? '0', 10) || 0);
    const offset = page * PAGE_SIZE;
    const status = sp.get('status');
    const userEmail = sp.get('user_email');
    const requestId = sp.get('request_id');
    const model = sp.get('model');

    const r = await db.execute(sql`
      SELECT r.request_id, r.created_at, r.org_id::text AS org_id,
             u.email AS user_email,
             r.model_slug, r.upstream_id,
             r.status_code, r.latency_ms, r.total_cost_rub
      FROM requests r
      LEFT JOIN organizations o ON o.id = r.org_id
      LEFT JOIN users u ON u.id = o.owner_id
      WHERE r.created_at >= ${from.toISOString()}::timestamptz
        AND r.created_at <= ${to.toISOString()}::timestamptz
        AND (${requestId}::text IS NULL OR r.request_id = ${requestId})
        AND (${userEmail}::text IS NULL OR u.email ILIKE ${'%' + (userEmail ?? '') + '%'})
        AND (${model}::text IS NULL OR r.model_slug ILIKE ${'%' + (model ?? '') + '%'})
        AND (
          ${status}::text IS NULL
          OR (${status} = 'success' AND r.status_code BETWEEN 200 AND 299)
          OR (${status} = '4xx'     AND r.status_code BETWEEN 400 AND 499)
          OR (${status} = '5xx'     AND r.status_code BETWEEN 500 AND 599)
          OR (${status} = 'timeout' AND r.status_code IS NULL)
        )
      ORDER BY r.created_at DESC
      LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `);

    return NextResponse.json({ requests: rowsOf(r), page, page_size: PAGE_SIZE });
  } catch (e) {
    return err(e);
  }
}
