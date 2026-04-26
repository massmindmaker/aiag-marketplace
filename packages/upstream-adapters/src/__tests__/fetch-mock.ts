/**
 * Tiny fetch mock helper for adapter tests — avoids pulling MSW.
 * Each call returns queued responses in order.
 */
export interface MockResponseSpec {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
  delay_ms?: number;
  throwError?: Error;
}

export interface FetchCall {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

export function createFetchMock(queue: MockResponseSpec[] = []) {
  const calls: FetchCall[] = [];

  const mockFetch: typeof fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : (input as URL | Request).toString();
    const method = init?.method ?? 'GET';
    const headers: Record<string, string> = {};
    if (init?.headers) {
      if (init.headers instanceof Headers) {
        init.headers.forEach((v, k) => (headers[k] = v));
      } else if (Array.isArray(init.headers)) {
        for (const [k, v] of init.headers) headers[k] = v;
      } else {
        Object.assign(headers, init.headers as Record<string, string>);
      }
    }
    const body = typeof init?.body === 'string' ? init.body : undefined;
    calls.push({ url, method, headers, body });

    const spec = queue.shift();
    if (!spec) {
      return new Response(JSON.stringify({ error: 'no mock queued' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (spec.delay_ms) await new Promise((r) => setTimeout(r, spec.delay_ms));
    if (spec.throwError) throw spec.throwError;
    const responseBody =
      typeof spec.body === 'string' ? spec.body : JSON.stringify(spec.body ?? {});
    return new Response(responseBody, {
      status: spec.status ?? 200,
      headers: {
        'content-type': 'application/json',
        ...(spec.headers ?? {}),
      },
    });
  };

  return {
    fetch: mockFetch,
    calls,
    enqueue(...specs: MockResponseSpec[]) {
      queue.push(...specs);
    },
  };
}
