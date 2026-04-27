import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, verificationTokens } from '@aiag/database/schema';
import { eq, and } from '@aiag/database';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  token: z.string().min(16),
  new_password: z
    .string()
    .min(8)
    .max(128)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
});

/**
 * POST /api/auth/reset-password { token, new_password }
 * Verifies one-time token, bcrypts password, updates user, deletes token.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { token, new_password } = parsed.data;

    const record = await db.query.verificationTokens.findFirst({
      where: eq(verificationTokens.token, token),
    });

    if (!record) {
      return NextResponse.json({ error: 'invalid or expired token' }, { status: 400 });
    }
    if (record.expires.getTime() < Date.now()) {
      await db
        .delete(verificationTokens)
        .where(eq(verificationTokens.token, token));
      return NextResponse.json({ error: 'invalid or expired token' }, { status: 400 });
    }
    if (!record.identifier.startsWith('password-reset:')) {
      return NextResponse.json({ error: 'wrong token type' }, { status: 400 });
    }

    const email = record.identifier.slice('password-reset:'.length);
    const passwordHash = await bcrypt.hash(new_password, 12);

    await db.update(users).set({ passwordHash }).where(eq(users.email, email));
    await db
      .delete(verificationTokens)
      .where(
        and(
          eq(verificationTokens.token, token),
          eq(verificationTokens.identifier, record.identifier)
        )
      );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('reset-password error', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
