import { NextResponse } from 'next/server';
import { AdminAuthError, requireAdmin } from './guard';

/**
 * Wrap an admin API handler. Returns 401/403 on auth errors automatically.
 */
export async function withAdmin<T>(
  fn: (ctx: { user: Awaited<ReturnType<typeof requireAdmin>>['user'] }) => Promise<T>
): Promise<T | NextResponse> {
  try {
    const { user } = await requireAdmin();
    return await fn({ user });
  } catch (e) {
    if (e instanceof AdminAuthError) {
      const status = e.code === 'UNAUTHORIZED' ? 401 : 403;
      return NextResponse.json({ error: e.code }, { status }) as unknown as T;
    }
    // eslint-disable-next-line no-console
    console.error('[admin api]', e);
    return NextResponse.json({ error: 'INTERNAL' }, { status: 500 }) as unknown as T;
  }
}
