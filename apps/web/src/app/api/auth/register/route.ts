import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@aiag/database/schema';
import { eq } from '@aiag/database';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Validation schema
const registerSchema = z.object({
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа').max(100),
  email: z.string().email('Некорректный email'),
  password: z
    .string()
    .min(8, 'Пароль должен содержать минимум 8 символов')
    .max(128)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Пароль должен содержать заглавные, строчные буквы и цифры'
    ),
  // 152-FZ (May 2025) — 3 explicit consents
  consentProcessing: z.literal(true, {
    errorMap: () => ({ message: 'Требуется согласие на обработку ПДн' }),
  }),
  consentTransborder: z.literal(true, {
    errorMap: () => ({ message: 'Требуется согласие на трансграничную передачу' }),
  }),
  consentMarketing: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Ошибка валидации',
          details: validation.error.errors.map((e) => ({
            field: e.path[0],
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const { name, email, password, consentProcessing, consentTransborder, consentMarketing } = validation.data;

    // Capture consent metadata per 152-FZ
    const ipHeader =
      request.headers.get('x-forwarded-for') ??
      request.headers.get('x-real-ip') ??
      '';
    const consentIpAddress = ipHeader.split(',')[0].trim().slice(0, 45) || null;
    const consentUserAgent = (request.headers.get('user-agent') ?? '').slice(0, 2000) || null;
    const consentTimestamp = new Date();

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 409 }
      );
    }

    // Hash password with bcrypt
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate username from email
    const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') +
      Math.random().toString(36).substring(2, 6);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email: email.toLowerCase(),
        passwordHash,
        username,
        role: 'user',
        isActive: true,
        isBanned: false,
        consentProcessing,
        consentTransborder,
        consentMarketing,
        consentTimestamp,
        consentIpAddress: consentIpAddress ?? undefined,
        consentUserAgent: consentUserAgent ?? undefined,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        username: users.username,
      });

    return NextResponse.json(
      {
        message: 'Регистрация успешна',
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
