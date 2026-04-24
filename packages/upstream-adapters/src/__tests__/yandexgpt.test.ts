import { describe, it, expect } from 'vitest';
import { YandexGPTAdapter } from '../adapters/yandexgpt';
import { YandexIamTokenManager } from '../adapters/yandex-iam';
import { createFetchMock } from './fetch-mock';

describe('YandexGPTAdapter', () => {
  it('sends completion with modelUri and folder header', async () => {
    const iamMock = createFetchMock([
      { status: 200, body: { iamToken: 'iam-t', expiresAt: new Date(Date.now() + 3600_000).toISOString() } },
    ]);
    const chatMock = createFetchMock([{ status: 200, body: { result: { alternatives: [] } } }]);
    const iam = new YandexIamTokenManager({
      serviceAccountKey: { id: 'k', service_account_id: 'sa', private_key: 'p' },
      signJwt: async () => 'jwt',
      fetch: iamMock.fetch,
    });
    const adapter = new YandexGPTAdapter({
      iam,
      folder_id: 'b1g-folder',
      fetch: chatMock.fetch,
    });
    await adapter.chatCompletions(
      {
        model: 'gpt://b1g-folder/yandexgpt-lite/latest',
        messages: [{ role: 'user', content: 'привет' }],
      },
      { request_id: 'r1' },
    );
    expect(chatMock.calls[0].url).toContain('/completion');
    expect(chatMock.calls[0].headers['authorization']).toBe('Bearer iam-t');
    expect(chatMock.calls[0].headers['x-folder-id']).toBe('b1g-folder');
    const body = JSON.parse(chatMock.calls[0].body!);
    expect(body.modelUri).toContain('yandexgpt-lite');
    expect(body.messages[0]).toEqual({ role: 'user', text: 'привет' });
  });

  it('lists hardcoded models tied to folder_id', async () => {
    const iam = new YandexIamTokenManager({
      serviceAccountKey: { id: 'k', service_account_id: 'sa', private_key: 'p' },
      signJwt: async () => 'jwt',
    });
    const adapter = new YandexGPTAdapter({ iam, folder_id: 'FOLDER' });
    const models = await adapter.listModels();
    expect(models.length).toBeGreaterThan(0);
    expect(models[0].id).toContain('FOLDER');
  });
});
