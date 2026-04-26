import { describe, it, expect, beforeEach } from 'vitest';
import { randomBytes } from 'node:crypto';
import {
  ReplicateAdapter,
  InMemoryTokenCache,
  type ReplicateModelMeta,
} from '../adapters/replicate';
import { envelopeEncrypt } from '../byok/encryption';
import { createFetchMock } from './fetch-mock';

function makeReplicateModel(kekAdmin: Buffer, overrides?: Partial<ReplicateModelMeta>): ReplicateModelMeta {
  const { secret, dek_encrypted } = envelopeEncrypt('r8_authortoken_abc', kekAdmin);
  return {
    id: 'author-42/cool-model',
    name: 'Cool Model',
    modality: 'image',
    pricing: { per_image: 0.04 },
    config: {
      replicate_version: 'abc123def',
      replicate_token_encrypted: secret,
      author_dek_encrypted: dek_encrypted,
      author_id: 'author-42',
    },
    ...overrides,
  };
}

describe('ReplicateAdapter', () => {
  let kek: Buffer;

  beforeEach(() => {
    kek = randomBytes(32);
  });

  it('imageGenerations envelope-decrypts author token and submits prediction with cog version', async () => {
    const model = makeReplicateModel(kek);
    const mock = createFetchMock([
      {
        status: 201,
        body: {
          id: 'pred-1',
          status: 'starting',
          urls: { get: 'https://api.replicate.com/v1/predictions/pred-1' },
        },
      },
    ]);
    const adapter = new ReplicateAdapter({
      kek_admin: kek,
      fetch: mock.fetch,
      tokenCache: new InMemoryTokenCache(),
    });
    const handle = await adapter.imageGenerations(
      { model: model.id, prompt: 'a cat' },
      { request_id: 'r1', model_meta: model } as never,
    );
    expect(handle.task_id).toBe('pred-1');
    expect(handle.poll_url).toContain('/predictions/pred-1');
    expect(mock.calls[0].headers['authorization']).toBe('Token r8_authortoken_abc');
    const submitted = JSON.parse(mock.calls[0].body ?? '{}');
    expect(submitted.version).toBe('abc123def');
    expect(submitted.input.prompt).toBe('a cat');
  });

  it('cache: second call reuses decrypted token (single fetch for token never refires crypto)', async () => {
    const model = makeReplicateModel(kek);
    const mock = createFetchMock([
      { status: 201, body: { id: 'p1', urls: { get: 'x' } } },
      { status: 201, body: { id: 'p2', urls: { get: 'y' } } },
    ]);
    const cache = new InMemoryTokenCache();
    const adapter = new ReplicateAdapter({ kek_admin: kek, fetch: mock.fetch, tokenCache: cache });
    await adapter.imageGenerations(
      { model: model.id, prompt: 'a' },
      { request_id: 'r1', model_meta: model } as never,
    );
    const cachedToken = await cache.get(`replicate_token:${model.id}`);
    expect(cachedToken).toBe('r8_authortoken_abc');

    // Tamper with ciphertext — if cache is hit, call still succeeds
    const broken: ReplicateModelMeta = {
      ...model,
      config: {
        ...model.config,
        replicate_token_encrypted: { ...model.config.replicate_token_encrypted, ciphertext: 'YmFk' },
      },
    };
    const res = adapter.imageGenerations(
      { model: model.id, prompt: 'b' },
      { request_id: 'r2', model_meta: broken } as never,
    );
    await expect(res).resolves.toBeDefined();
  });

  it('invalidateToken drops cached plaintext so next call re-decrypts', async () => {
    const model = makeReplicateModel(kek);
    const cache = new InMemoryTokenCache();
    const adapter = new ReplicateAdapter({
      kek_admin: kek,
      fetch: createFetchMock([{ status: 201, body: { id: 'p1', urls: {} } }]).fetch,
      tokenCache: cache,
    });
    await adapter.imageGenerations(
      { model: model.id, prompt: 'x' },
      { request_id: 'r1', model_meta: model } as never,
    );
    expect(await cache.get(`replicate_token:${model.id}`)).toBe('r8_authortoken_abc');
    await adapter.invalidateToken(model.id);
    expect(await cache.get(`replicate_token:${model.id}`)).toBeNull();
  });

  it('pollAsync maps succeeded → completed, failed → failed, processing → pending', async () => {
    const model = makeReplicateModel(kek);

    const m1 = createFetchMock([
      { status: 200, body: { status: 'succeeded', output: ['https://img.png'] } },
    ]);
    const a1 = new ReplicateAdapter({ kek_admin: kek, fetch: m1.fetch });
    const r1 = await a1.pollAsync('p', { request_id: 'r', model_meta: model } as never);
    expect(r1.status).toBe('completed');

    const m2 = createFetchMock([{ status: 200, body: { status: 'failed', error: 'oom' } }]);
    const a2 = new ReplicateAdapter({ kek_admin: kek, fetch: m2.fetch });
    const r2 = await a2.pollAsync('p', { request_id: 'r', model_meta: model } as never);
    expect(r2.status).toBe('failed');
    expect(r2.error).toBe('oom');

    const m3 = createFetchMock([{ status: 200, body: { status: 'processing' } }]);
    const a3 = new ReplicateAdapter({ kek_admin: kek, fetch: m3.fetch });
    const r3 = await a3.pollAsync('p', { request_id: 'r', model_meta: model } as never);
    expect(r3.status).toBe('pending');
  });

  it('rejects submission when model_meta missing (contract violation)', async () => {
    const adapter = new ReplicateAdapter({
      kek_admin: kek,
      fetch: createFetchMock([]).fetch,
    });
    await expect(
      adapter.imageGenerations(
        { model: 'x', prompt: 'p' },
        { request_id: 'r' } as never,
      ),
    ).rejects.toThrow(/model_meta/);
  });

  it('estimateCost is pass-through (markup = 1.0, credits = revenue × usd_rate)', async () => {
    const adapter = new ReplicateAdapter({ kek_admin: kek, usd_rate: 100 });
    const est = await adapter.estimateCost(
      { n: 2 },
      {
        id: 'author/model',
        name: 'm',
        modality: 'image',
        pricing: { per_image: 0.04 },
      },
    );
    // 2 * 0.04 = $0.08 revenue; *1.0 markup *100 rate = 8 credits
    expect(est.upstream_cost_usd).toBe(0.08);
    expect(est.breakdown.markup).toBe(1.0);
    expect(est.credits).toBe(8);
  });

  it('validateCog returns ok=true when openapi_schema present', async () => {
    const mock = createFetchMock([
      { status: 200, body: { latest_version: { openapi_schema: { components: {} } } } },
    ]);
    const adapter = new ReplicateAdapter({ kek_admin: kek, fetch: mock.fetch });
    const res = await adapter.validateCog('owner', 'name', 'r8_token');
    expect(res.ok).toBe(true);
    expect(res.schema).toBeDefined();
  });

  it('validateCog returns ok=false with error when schema missing', async () => {
    const mock = createFetchMock([
      { status: 200, body: { latest_version: {} } },
    ]);
    const adapter = new ReplicateAdapter({ kek_admin: kek, fetch: mock.fetch });
    const res = await adapter.validateCog('owner', 'name', 'r8_token');
    expect(res.ok).toBe(false);
    expect(res.error).toContain('openapi_schema');
  });

  it('listModels returns empty array (author-registered models live in DB)', async () => {
    const adapter = new ReplicateAdapter({ kek_admin: kek });
    expect(await adapter.listModels()).toEqual([]);
  });

  it('pricingSync returns empty array (author-set, not synced from Replicate)', async () => {
    const adapter = new ReplicateAdapter({ kek_admin: kek });
    expect(await adapter.pricingSync()).toEqual([]);
  });
});

describe('InMemoryTokenCache', () => {
  it('respects TTL: entry expires after ttl_seconds', async () => {
    const cache = new InMemoryTokenCache();
    await cache.set('k', 'v', 0.01); // 10ms
    expect(await cache.get('k')).toBe('v');
    await new Promise((r) => setTimeout(r, 20));
    expect(await cache.get('k')).toBeNull();
  });

  it('del removes entry immediately', async () => {
    const cache = new InMemoryTokenCache();
    await cache.set('k', 'v', 60);
    await cache.del('k');
    expect(await cache.get('k')).toBeNull();
  });
});
