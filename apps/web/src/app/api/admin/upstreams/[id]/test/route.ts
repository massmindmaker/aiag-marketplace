import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import { requireAdmin, audit, AdminAuthError } from '@/lib/admin/guard';
import { firstRow } from '@/lib/admin/rows';

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { user: admin } = await requireAdmin();
    const { id } = await ctx.params;
    const r = await db.execute(sql`SELECT id, base_url FROM upstreams WHERE id = ${id}`);
    const row = firstRow<{ id: string; base_url: string | null }>(r);
    if (!row) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

    let ok = false;
    let latency = 0;
    let error: string | null = null;
    if (row.base_url) {
      const start = Date.now();
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 8000);
        const resp = await fetch(row.base_url, { method: 'GET', signal: ctrl.signal }).catch((e) => {
          throw e;
        });
        clearTimeout(t);
        ok = resp.status < 500;
        latency = Date.now() - start;
      } catch (e) {
        error = (e as Error).message;
        latency = Date.now() - start;
      }
    } else {
      error = 'no base_url';
    }

    await db.execute(sql`
      INSERT INTO upstream_health (upstream_id, ok, latency_ms, error)
      VALUES (${id}, ${ok}, ${latency}, ${error})
    `);
    await audit(admin.email, 'upstream.test', 'upstream', id, { ok, latency, error });

    return NextResponse.json({ ok, latency_ms: latency, error });
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ error: e.code }, { status: e.code === 'UNAUTHORIZED' ? 401 : 403 });
    }
    console.error(e);
    return NextResponse.json({ error: 'INTERNAL' }, { status: 500 });
  }
}
