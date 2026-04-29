import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import { requireAdmin, audit, AdminAuthError } from '@/lib/admin/guard';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    await requireAdmin();
    const r = await db.execute(sql`SELECT key, value, description, updated_at FROM admin_settings`);
    const rows = ((r as unknown as { rows?: unknown[] }).rows ?? r) as Array<{
      key: string;
      value: unknown;
    }>;
    const obj: Record<string, unknown> = {};
    for (const row of rows) obj[row.key] = row.value;
    return NextResponse.json(obj);
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ error: e.code }, { status: e.code === 'UNAUTHORIZED' ? 401 : 403 });
    }
    return NextResponse.json({ error: 'INTERNAL' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user: admin } = await requireAdmin();
    const body = (await req.json()) as Record<string, unknown>;
    for (const [key, value] of Object.entries(body)) {
      const json = JSON.stringify(value);
      await db.execute(sql`
        INSERT INTO admin_settings (key, value, updated_at, updated_by_email)
        VALUES (${key}, ${json}::jsonb, NOW(), ${admin.email})
        ON CONFLICT (key) DO UPDATE SET
          value = EXCLUDED.value,
          updated_at = EXCLUDED.updated_at,
          updated_by_email = EXCLUDED.updated_by_email
      `);
    }
    await audit(admin.email, 'settings.update', 'settings', null, { keys: Object.keys(body) });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ error: e.code }, { status: e.code === 'UNAUTHORIZED' ? 401 : 403 });
    }
    console.error(e);
    return NextResponse.json({ error: 'INTERNAL', message: (e as Error).message }, { status: 500 });
  }
}
