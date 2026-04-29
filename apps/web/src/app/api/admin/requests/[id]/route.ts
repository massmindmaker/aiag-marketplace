import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import { requireAdmin, AdminAuthError } from '@/lib/admin/guard';
import { firstRow, rowsOf } from '@/lib/admin/rows';

export const dynamic = 'force-dynamic';

function maskHeaders(h: Record<string, unknown> | null | undefined): Record<string, unknown> {
  if (!h || typeof h !== 'object') return {};
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(h)) {
    const lk = k.toLowerCase();
    if (lk === 'authorization' || lk === 'x-api-key' || lk.includes('cookie')) {
      out[k] = '***';
    } else {
      out[k] = h[k];
    }
  }
  return out;
}

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

    const reqRow = firstRow<Record<string, unknown>>(
      await db.execute(sql`
        SELECT r.*, o.name AS org_name, u.email AS user_email
        FROM requests r
        LEFT JOIN organizations o ON o.id = r.org_id
        LEFT JOIN users u ON u.id = o.owner_id
        WHERE r.request_id = ${id}
        ORDER BY r.created_at DESC
        LIMIT 1
      `)
    );
    if (!reqRow) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

    const respRow = firstRow<Record<string, unknown>>(
      await db.execute(sql`
        SELECT body, headers, created_at
        FROM responses
        WHERE request_id = ${id}
        ORDER BY created_at DESC
        LIMIT 1
      `)
    );

    const settle = rowsOf<Record<string, unknown>>(
      await db.execute(sql`
        SELECT type, source, delta, metadata, created_at
        FROM gateway_transactions
        WHERE request_id = ${id}
        ORDER BY created_at ASC
      `)
    );

    const pii = rowsOf<Record<string, unknown>>(
      await db.execute(sql`
        SELECT kind, action, model_slug, created_at
        FROM pii_detections
        WHERE request_id = ${id}
        ORDER BY created_at ASC
      `)
    );

    return NextResponse.json({
      request: reqRow,
      response: respRow
        ? { ...respRow, headers: maskHeaders(respRow.headers as Record<string, unknown>) }
        : null,
      settle,
      pii,
    });
  } catch (e) {
    return err(e);
  }
}
