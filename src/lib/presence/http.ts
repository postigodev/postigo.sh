export interface CachePolicy {
  browser: string;
  cdn: string;
}

export const spotifyCache = {
  browser: 'public, max-age=0, must-revalidate',
  cdn: 'public, s-maxage=30, stale-while-revalidate=120',
} as const satisfies CachePolicy;

export const githubCache = {
  browser: 'public, max-age=0, must-revalidate',
  cdn: 'public, s-maxage=21600, stale-while-revalidate=64800',
} as const satisfies CachePolicy;

export const mediaLogCache = {
  browser: 'public, max-age=0, must-revalidate',
  cdn: 'public, s-maxage=300, stale-while-revalidate=1800',
} as const satisfies CachePolicy;

const noStoreCache = {
  browser: 'no-store',
  cdn: 'no-store',
} as const satisfies CachePolicy;

export function json(body: unknown, status: number, cachePolicy: CachePolicy, extraHeaders?: HeadersInit): Response {
  const headers = new Headers(extraHeaders);
  headers.set('content-type', 'application/json; charset=utf-8');
  headers.set('cache-control', cachePolicy.browser);
  headers.set('cdn-cache-control', cachePolicy.cdn);
  headers.set('x-content-type-options', 'nosniff');
  return new Response(JSON.stringify(body), { status, headers });
}

export function jsonForMethod(
  method: string,
  body: unknown,
  status: number,
  cachePolicy: CachePolicy,
  extraHeaders?: HeadersInit,
): Response {
  const response = json(body, status, cachePolicy, extraHeaders);
  if (method.toUpperCase() !== 'HEAD') return response;
  return new Response(null, { status: response.status, headers: response.headers });
}

export function guardPublicRead(request: Request): Response | undefined {
  const method = request.method.toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') {
    return jsonForMethod(method, { error: 'METHOD_NOT_ALLOWED' }, 405, noStoreCache, { allow: 'GET, HEAD' });
  }
  if (new URL(request.url).search !== '') {
    return jsonForMethod(method, { error: 'INVALID_REQUEST' }, 400, noStoreCache);
  }
  return undefined;
}

export async function readJsonBounded<T>(response: Response, limitBytes = 262_144): Promise<T> {
  const declaredLength = response.headers.get('content-length');
  if (declaredLength !== null) {
    const length = Number(declaredLength);
    if (Number.isFinite(length) && length > limitBytes) {
      throw new Error(`upstream payload exceeds ${limitBytes} bytes`);
    }
  }

  if (!response.body) return JSON.parse('') as T;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > limitBytes) {
        await reader.cancel();
        throw new Error(`upstream payload exceeds ${limitBytes} bytes`);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
}

export async function readTextBounded(response: Response, limitBytes = 262_144): Promise<string> {
  const declaredLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > limitBytes) throw new Error(`upstream payload exceeds ${limitBytes} bytes`);
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > limitBytes) {
        await reader.cancel();
        throw new Error(`upstream payload exceeds ${limitBytes} bytes`);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(bytes);
}
