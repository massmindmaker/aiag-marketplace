import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import { requireAdmin, audit, AdminAuthError } from '@/lib/admin/guard';
import { firstRow } from '@/lib/admin/rows';

export const dynamic = 'force-dynamic';

type Row = {
  id: string;
  model_slug: string;
  modality: string;
  upstream_id: string;
  base_url: string | null;
  upstream_model_id: string;
};

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { user: admin } = await requireAdmin();
    const { id } = await ctx.params;

    const row = firstRow<Row>(
      await db.execute(sql`
        SELECT mu.id::text AS id,
               m.slug AS model_slug, m.type AS modality,
               u.id AS upstream_id, u.base_url, mu.upstream_model_id
        FROM model_upstreams mu
        JOIN models m ON m.id = mu.model_id
        JOIN upstreams u ON u.id = mu.upstream_id
        WHERE mu.id = ${id}::uuid
      `)
    );
    if (!row) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

    let ok = false;
    let latency = 0;
    let error: string | null = null;
    let sample: string | null = null;

    if (!row.base_url) {
      error = 'no base_url configured';
    } else {
      const start = Date.now();
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 8000);
        const resp = await fetch(row.base_url, { method: 'GET', signal: ctrl.signal });
        clearTimeout(t);
        latency = Date.now() - start;
        ok = resp.status < 500;
        const text = await resp.text().catch(() => '');
        sample = text.slice(0, 500);
      } catch (e) {
        error = (e as Error).message;
        latency = Date.now() - start;
      }
    }

    await audit(admin.email, 'routing.test', 'model_upstream', id, {
      ok,
      latency,
      upstream_id: row.upstream_id,
      model_slug: row.model_slug,
    });

    return NextResponse.json({ ok, latency_ms: latency, error, sample });
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ error: e.code }, { status: e.code === 'UNAUTHORIZED' ? 401 : 403 });
    }
    console.error(e);
    return NextResponse.json({ error: 'INTERNAL' }, { status: 500 });
  }
}
