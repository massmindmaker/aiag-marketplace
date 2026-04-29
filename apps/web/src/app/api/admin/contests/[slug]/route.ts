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
  return NextResponse.json({ error: 'INTERNAL', message: (e as Error).message }, { status: 500 });
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  try {
    await requireAdmin();
    const { slug } = await ctx.params;
    const r = await db.execute(sql`SELECT * FROM contests WHERE slug = ${slug}`);
    return NextResponse.json({ contest: firstRow(r) });
  } catch (e) {
    return err(e);
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  try {
    const { user: admin } = await requireAdmin();
    await ctx.params;
    const body = (await req.json()) as Record<string, string>;
    const slug = body.slug;
    if (!slug || !body.name) return NextResponse.json({ error: 'BAD_INPUT' }, { status: 400 });
    const startsAt = body.starts_at ? new Date(body.starts_at) : null;
    const endsAt = body.ends_at ? new Date(body.ends_at) : null;
    const prize = body.total_prize_pool ? Number(body.total_prize_pool) : null;
    await db.execute(sql`
      INSERT INTO contests (slug, name, description, dataset_url, eval_metric,
        total_prize_pool, starts_at, ends_at, sponsor_id, status, owner_id, is_public)
      VALUES (${slug}, ${body.name}, ${body.description ?? null}, ${body.dataset_url ?? null},
        ${body.eval_metric ?? null}, ${prize}, ${startsAt}, ${endsAt},
        ${body.sponsor_id || null}, 'draft'::contest_status,
        (SELECT id FROM users WHERE email = ${admin.email}), TRUE)
    `);
    await audit(admin.email, 'contest.create', 'contest', slug, body);
    return NextResponse.json({ ok: true, slug });
  } catch (e) {
    return err(e);
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  try {
    const { user: admin } = await requireAdmin();
    const { slug } = await ctx.params;
    const body = (await req.json()) as Record<string, string | number | undefined> & {
      op?: string;
      submissionId?: string;
      rank?: number;
    };

    if (body.op === 'setWinner' && body.submissionId) {
      await db.execute(sql`
        UPDATE contest_submissions SET rank = ${body.rank ?? null}
        WHERE id = ${body.submissionId}
      `);
      await audit(admin.email, 'contest.set_winner', 'contest', slug, {
        submissionId: body.submissionId,
        rank: body.rank,
      });
      return NextResponse.json({ ok: true });
    }

    // Generic field update
    const startsAt = body.starts_at ? new Date(body.starts_at as string) : null;
    const endsAt = body.ends_at ? new Date(body.ends_at as string) : null;
    const prize = body.total_prize_pool != null ? Number(body.total_prize_pool) : null;
    await db.execute(sql`
      UPDATE contests SET
        name = COALESCE(${body.name ?? null}, name),
        description = ${body.description ?? null},
        dataset_url = ${body.dataset_url ?? null},
        eval_metric = ${body.eval_metric ?? null},
        total_prize_pool = COALESCE(${prize}, total_prize_pool),
        starts_at = ${startsAt},
        ends_at = ${endsAt},
        sponsor_id = ${body.sponsor_id || null},
        updated_at = NOW()
      WHERE slug = ${slug}
    `);
    await audit(admin.email, 'contest.update', 'contest', slug, body as never);
    return NextResponse.json({ ok: true, slug });
  } catch (e) {
    return err(e);
  }
}
