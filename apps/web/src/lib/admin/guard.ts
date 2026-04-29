import { auth } from '@/auth';
import { db, eq, sql } from '@/lib/db';
import { users } from '@aiag/database/schema';
import { headers } from 'next/headers';

export class AdminAuthError extends Error {
  constructor(public code: 'UNAUTHORIZED' | 'FORBIDDEN') {
    super(code);
  }
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) throw new AdminAuthError('UNAUTHORIZED');
  const u = await db.query.users.findFirst({
    where: eq(users.email, session.user.email),
  });
  if (!u || u.role !== 'admin') throw new AdminAuthError('FORBIDDEN');
  return { user: u, session };
}

/**
 * Append a row to audit_log. Best-effort; does not throw on failure
 * so admin actions don't get rolled back due to logging.
 */
export async function audit(
  actorEmail: string,
  action: string,
  resourceType: string,
  resourceId: string | null,
  details: Record<string, unknown> = {}
): Promise<void> {
  try {
    let ip: string | null = null;
    try {
      const h = await headers();
      ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null;
    } catch {
      // headers() may throw outside of request scope
    }
    await db.execute(sql`
      INSERT INTO audit_log (actor_email, action, resource_type, resource_id, details, ip_address, created_at)
      VALUES (${actorEmail}, ${action}, ${resourceType}, ${resourceId}, ${JSON.stringify(details)}::jsonb, ${ip}, NOW())
    `);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[audit] failed to insert', e);
  }
}
