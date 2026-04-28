/**
 * Tests for /api/dashboard/keys + /api/dashboard/keys/[id].
 * Mocks @/auth and @/lib/db so we don't touch real Postgres.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));

// In-memory key store so we can test list / create / patch / delete.
type Row = {
  id: string;
  orgId: string;
  name: string;
  keyHash: string;
  keyPrefix: string;
  costLimitMonthlyRub: string | null;
  modelWhitelist: string[];
  ruResidencyOnly: boolean;
  disabledAt: Date | null;
  revokedAt: Date | null;
  lastUsedAt: Date | null;
  createdAt: Date;
};
const STORE: Row[] = [];

vi.mock('@/lib/db', () => {
  // Build a minimal chainable query builder that supports the call shapes we use.
  function chain(rows: unknown[]) {
    const obj: Record<string, unknown> = {
      from: () => obj,
      where: () => obj,
      orderBy: () => Promise.resolve(rows),
      groupBy: () => obj,
      limit: () => Promise.resolve(rows),
    };
    return obj;
  }
  return {
    db: {
      query: {
        gatewayApiKeys: {
          findFirst: vi.fn(async ({ where: _w }: { where?: unknown }) => {
            return STORE[STORE.length - 1] ?? null;
          }),
        },
        organizationMembers: { findFirst: vi.fn(async () => null) },
        organizations: { findFirst: vi.fn(async () => ({ id: 'org-test' })) },
      },
      select: () => chain(STORE),
      insert: () => ({
        values: (vals: Partial<Row>) => ({
          returning: (_cols?: unknown) => {
            const row: Row = {
              id: `k_${STORE.length + 1}`,
              orgId: vals.orgId || 'org-test',
              name: vals.name || 'k',
              keyHash: vals.keyHash || 'h',
              keyPrefix: vals.keyPrefix || 'sk_aiag_live_xxxx',
              costLimitMonthlyRub: vals.costLimitMonthlyRub ?? null,
              modelWhitelist: (vals.modelWhitelist as string[]) ?? [],
              ruResidencyOnly: !!vals.ruResidencyOnly,
              disabledAt: null,
              revokedAt: null,
              lastUsedAt: null,
              createdAt: new Date(),
            };
            STORE.push(row);
            return Promise.resolve([row]);
          },
          onConflictDoNothing: () => Promise.resolve(),
        }),
      }),
      update: () => ({
        set: (s: Partial<Row>) => ({
          where: () => ({
            returning: () => {
              const last = STORE[STORE.length - 1];
              if (last) Object.assign(last, s);
              return Promise.resolve([last]);
            },
          }),
        }),
      }),
    },
    eq: () => ({}),
    and: () => ({}),
    or: () => ({}),
    desc: () => ({}),
    asc: () => ({}),
    sql: () => ({}),
    isNull: () => ({}),
    gte: () => ({}),
    lte: () => ({}),
  };
});

vi.mock('@aiag/database/schema', () => ({
  gatewayApiKeys: { id: 'id', name: 'name', orgId: 'orgId', keyPrefix: 'p', createdAt: 'c' },
  organizations: { id: 'id', ownerId: 'o' },
  organizationMembers: { userId: 'u', organizationId: 'o' },
}));

vi.mock('@aiag/database', () => ({
  eq: () => ({}),
  and: () => ({}),
  or: () => ({}),
  desc: () => ({}),
  asc: () => ({}),
  isNull: () => ({}),
  gte: () => ({}),
  lte: () => ({}),
  sql: () => ({}),
}));

import { auth } from '@/auth';
import { GET, POST } from '@/app/api/dashboard/keys/route';
import { PATCH, DELETE } from '@/app/api/dashboard/keys/[id]/route';

const mockedAuth = auth as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockedAuth.mockReset();
  STORE.length = 0;
});

function jreq(method: string, body?: unknown) {
  return new Request('http://localhost/api/dashboard/keys', {
    method,
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  }) as never;
}

describe('GET /api/dashboard/keys', () => {
  it('rejects unauthenticated', async () => {
    mockedAuth.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns list for authenticated user', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'u1' } });
    const res = await GET();
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.ok).toBe(true);
    expect(Array.isArray(j.keys)).toBe(true);
  });
});

describe('POST /api/dashboard/keys', () => {
  it('rejects unauthenticated', async () => {
    mockedAuth.mockResolvedValue(null);
    const res = await POST(jreq('POST', { name: 'x' }));
    expect(res.status).toBe(401);
  });

  it('rejects empty name', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'u1' } });
    const res = await POST(jreq('POST', { name: '' }));
    expect(res.status).toBe(400);
    const j = await res.json();
    expect(j.error).toBe('validation_failed');
  });

  it('returns full key once on create', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'u1' } });
    const res = await POST(jreq('POST', { name: 'prod', ruResidencyOnly: true }));
    expect(res.status).toBe(201);
    const j = await res.json();
    expect(j.ok).toBe(true);
    expect(typeof j.key).toBe('string');
    expect(j.key.startsWith('sk_aiag_live_')).toBe(true);
    expect(j.record.name).toBe('prod');
  });
});

describe('PATCH /api/dashboard/keys/[id]', () => {
  it('rejects unauthenticated', async () => {
    mockedAuth.mockResolvedValue(null);
    const res = await PATCH(jreq('PATCH', { name: 'x' }), {
      params: Promise.resolve({ id: 'k_1' }),
    });
    expect(res.status).toBe(401);
  });

  it('rejects when no changes specified', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'u1' } });
    // seed a row
    await POST(jreq('POST', { name: 'seed' }));
    const res = await PATCH(jreq('PATCH', {}), {
      params: Promise.resolve({ id: STORE[STORE.length - 1]!.id }),
    });
    expect(res.status).toBe(400);
  });

  it('disables a key', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'u1' } });
    await POST(jreq('POST', { name: 'seed' }));
    const id = STORE[STORE.length - 1]!.id;
    const res = await PATCH(jreq('PATCH', { disabled: true }), {
      params: Promise.resolve({ id }),
    });
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.ok).toBe(true);
  });
});

describe('DELETE /api/dashboard/keys/[id]', () => {
  it('rejects unauthenticated', async () => {
    mockedAuth.mockResolvedValue(null);
    const res = await DELETE(jreq('DELETE'), {
      params: Promise.resolve({ id: 'k_1' }),
    });
    expect(res.status).toBe(401);
  });

  it('soft-deletes when authenticated', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'u1' } });
    await POST(jreq('POST', { name: 'seed' }));
    const id = STORE[STORE.length - 1]!.id;
    const res = await DELETE(jreq('DELETE'), {
      params: Promise.resolve({ id }),
    });
    expect(res.status).toBe(200);
  });
});
