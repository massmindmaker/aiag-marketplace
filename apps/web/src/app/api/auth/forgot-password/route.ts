import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { db } from '@/lib/db';
import { users, verificationTokens } from '@aiag/database/schema';
import { eq } from '@aiag/database';
import { sendEmail } from '@aiag/email';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({ email: z.string().email() });

/**
 * POST /api/auth/forgot-password
 * Generates 1-hour token, persists in verification_tokens, emails reset link.
 * Always returns 200 (no user enumeration).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid email' }, { status: 400 });
    }
    const email = parsed.data.email.toLowerCase();

    const user = await db.query.users.findFirst({ where: eq(users.email, email) });

    // Only send if user exists; respond identically either way.
    if (user) {
      const token = randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1h

      await db.insert(verificationTokens).values({
        identifier: `password-reset:${email}`,
        token,
        expires,
      });

      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ??
        process.env.NEXTAUTH_URL ??
        'https://ai-aggregator.ru';
      const url = `${baseUrl.replace(/\/$/, '')}/reset-password?token=${token}`;

      await sendEmail({
        to: email,
        template: 'reset-password',
        data: { url, name: user.name ?? undefined },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('forgot-password error', err);
    // Still 200 to avoid enumeration but log internally
    return NextResponse.json({ ok: true });
  }
}
