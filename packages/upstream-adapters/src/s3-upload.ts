/**
 * S3 upload helper — moves media blobs returned from upstreams (HuggingFace
 * binary image, Fal/Kie/Replicate output URLs) into our S3 bucket so users
 * get stable URLs we control.
 *
 * Current state: Plan 05 does not yet have real S3 credentials — this module
 * ships a MOCK uploader (stores blobs in an in-memory map, returns fake
 * `https://storage.aiag.ru/...` URLs). Swap to the real AWS SDK client in
 * `apps/api-gateway/src/bootstrap.ts` when creds are provisioned (Task 14 —
 * out of scope here).
 *
 * Real impl signature should match `S3Uploader` below so callers don't
 * change when we switch.
 */

export interface S3UploadInput {
  key: string; // e.g. `orgs/${orgId}/media/${ts}-${rand}.png`
  body: ArrayBuffer | Uint8Array | string;
  content_type?: string;
  cache_control?: string;
}

export interface S3UploadResult {
  url: string;
  key: string;
  bytes: number;
}

export interface S3Uploader {
  upload(input: S3UploadInput): Promise<S3UploadResult>;
  /** Generate a presigned GET URL (real impl signs; mock returns stored url). */
  presignGet(key: string, ttl_seconds?: number): Promise<string>;
}

/**
 * Mock in-memory S3 uploader. Dev / test only.
 * Keeps blobs in a Map so callers can assert on what was uploaded.
 */
export class MockS3Uploader implements S3Uploader {
  public readonly store = new Map<string, { body: Uint8Array; content_type?: string }>();

  constructor(
    private readonly baseUrl: string = 'https://storage.aiag.ru',
    private readonly bucket: string = 'aiag-media-mock',
  ) {}

  async upload(input: S3UploadInput): Promise<S3UploadResult> {
    const body = toBuffer(input.body);
    this.store.set(input.key, { body, content_type: input.content_type });
    return {
      url: this.urlFor(input.key),
      key: input.key,
      bytes: body.byteLength,
    };
  }

  async presignGet(key: string, _ttl_seconds?: number): Promise<string> {
    // Mock: presign is just the public URL with a fake query param.
    return `${this.urlFor(key)}?mock_signed=1`;
  }

  private urlFor(key: string): string {
    return `${this.baseUrl}/${this.bucket}/${key}`;
  }
}

function toBuffer(body: S3UploadInput['body']): Uint8Array {
  if (typeof body === 'string') return new TextEncoder().encode(body);
  if (ArrayBuffer.isView(body)) {
    const view = body as ArrayBufferView;
    return new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
  }
  if (body instanceof ArrayBuffer) return new Uint8Array(body);
  return new TextEncoder().encode(String(body));
}

/**
 * Helper for fetching a media URL returned by an upstream and re-uploading it
 * to our S3 under a stable key. Used by polling workers when an async job
 * completes with a provider-hosted URL.
 */
export async function mirrorMediaToS3(
  uploader: S3Uploader,
  sourceUrl: string,
  destKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<S3UploadResult> {
  const res = await fetchImpl(sourceUrl);
  if (!res.ok) {
    throw new Error(`mirrorMediaToS3: source ${sourceUrl} returned ${res.status}`);
  }
  const buffer = await res.arrayBuffer();
  const content_type = res.headers.get('content-type') ?? 'application/octet-stream';
  return uploader.upload({ key: destKey, body: buffer, content_type });
}
