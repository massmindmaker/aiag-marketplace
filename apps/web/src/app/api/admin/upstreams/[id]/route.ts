import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import { requireAdmin, audit, AdminAuthError } from '@/lib/admin/guard';
import { firstRow } from '@/lib/admin/rows';

export const dynamic = 'force-dynamic';

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
    const r = await db.execute(sql`SELECT * FROM upstreams WHERE id = ${id}`);
    return NextResponse.json({ upstream: firstRow(r) });
  } catch (e) {
    return err(e);
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { user: admin } = await requireAdmin();
    const { id } = await ctx.params;
    const body = (await req.json()) as {
      op: 'toggle' | 'setMarkup';
      enabled?: boolean;
      markupPct?: number;
    };

    switch (body.op) {
      case 'toggle': {
        await db.execute(sql`UPDATE upstreams SET enabled = ${!!body.enabled} WHERE id = ${id}`);
        await audit(admin.email, 'upstream.toggle', 'upstream', id, { enabled: !!body.enabled });
        break;
      }
      case 'setMarkup': {
        if (typeof body.markupPct !== 'number') {
          return NextResponse.json({ error: 'BAD_MARKUP' }, { status: 400 });
        }
        await db.execute(sql`
          UPDATE upstreams
          SET metadata = jsonb_set(COALESCE(metadata,'{}'::jsonb), '{markup_pct}', to_jsonb(${body.markupPct}::numeric))
          WHERE id = ${id}
        `);
        await audit(admin.email, 'upstream.set_markup', 'upstream', id, { markupPct: body.markupPct });
        break;
      }
      default:
        return NextResponse.json({ error: 'UNKNOWN_OP' }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return err(e);
  }
}
