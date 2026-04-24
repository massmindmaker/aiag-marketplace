import { describe, it, expect } from 'vitest';
import { MockS3Uploader, mirrorMediaToS3 } from '../s3-upload';
import { createFetchMock } from './fetch-mock';

describe('MockS3Uploader', () => {
  it('upload stores body in map and returns stable URL', async () => {
    const up = new MockS3Uploader();
    const res = await up.upload({
      key: 'orgs/1/media/img.png',
      body: new TextEncoder().encode('HELLO'),
      content_type: 'image/png',
    });
    expect(res.url).toBe('https://storage.aiag.ru/aiag-media-mock/orgs/1/media/img.png');
    expect(res.bytes).toBe(5);
    expect(up.store.get('orgs/1/media/img.png')?.content_type).toBe('image/png');
  });

  it('upload accepts string body', async () => {
    const up = new MockS3Uploader();
    const res = await up.upload({ key: 'x', body: 'hello' });
    expect(res.bytes).toBe(5);
  });

  it('presignGet returns URL with mock_signed marker', async () => {
    const up = new MockS3Uploader();
    const signed = await up.presignGet('x');
    expect(signed).toContain('mock_signed=1');
  });
});

describe('mirrorMediaToS3', () => {
  it('fetches source URL and uploads body to destination key', async () => {
    const up = new MockS3Uploader();
    const bytes = new Uint8Array([1, 2, 3, 4]);
    const mock = createFetchMock([
      {
        status: 200,
        body: new TextDecoder('latin1').decode(bytes),
        headers: { 'content-type': 'image/png' },
      },
    ]);
    const res = await mirrorMediaToS3(
      up,
      'https://provider.example/output.png',
      'orgs/1/mirrored/output.png',
      mock.fetch,
    );
    expect(res.url).toContain('orgs/1/mirrored/output.png');
    expect(up.store.get('orgs/1/mirrored/output.png')?.content_type).toBe('image/png');
  });

  it('throws when source returns non-ok status', async () => {
    const up = new MockS3Uploader();
    const mock = createFetchMock([{ status: 404, body: 'not found' }]);
    await expect(
      mirrorMediaToS3(up, 'https://x/404', 'k', mock.fetch),
    ).rejects.toThrow(/404/);
  });
});
