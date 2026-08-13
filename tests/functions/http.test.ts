import { describe, expect, it } from 'vitest';
import {
  githubCache,
  guardPublicRead,
  jsonForMethod,
  readJsonBounded,
  spotifyCache,
} from '../../api/_lib/http';

describe('guardPublicRead', () => {
  it.each(['POST', 'PUT', 'PATCH', 'DELETE'])('rejects %s', (method) => {
    const response = guardPublicRead(new Request('https://portfolio.test/api/x', { method }));
    expect(response?.status).toBe(405);
    expect(response?.headers.get('allow')).toBe('GET, HEAD');
    expect(response?.headers.get('content-type')).toContain('application/json');
  });

  it('rejects query parameters and accepts fixed GET/HEAD requests', () => {
    expect(guardPublicRead(new Request('https://portfolio.test/api/x?user=attacker'))?.status).toBe(400);
    expect(guardPublicRead(new Request('https://portfolio.test/api/x'))).toBeUndefined();
    expect(guardPublicRead(new Request('https://portfolio.test/api/x', { method: 'HEAD' }))).toBeUndefined();
  });
});

describe('readJsonBounded', () => {
  it('parses a bounded streamed JSON response', async () => {
    await expect(readJsonBounded(new Response(JSON.stringify({ ok: true })))).resolves.toEqual({ ok: true });
  });

  it('rejects an oversized declared upstream body before parsing it', async () => {
    const response = new Response('x'.repeat(262_145), { headers: { 'content-length': '262145' } });
    await expect(readJsonBounded(response)).rejects.toThrow('upstream payload exceeds 262144 bytes');
  });

  it('rejects an oversized streamed upstream body without a content length', async () => {
    const response = new Response('x'.repeat(33));
    await expect(readJsonBounded(response, 32)).rejects.toThrow('upstream payload exceeds 32 bytes');
  });
});

describe('public JSON responses', () => {
  it('sets separate browser and CDN cache controls', async () => {
    const response = jsonForMethod('GET', { ok: true }, 200, spotifyCache);
    expect(response.headers.get('cache-control')).toBe(spotifyCache.browser);
    expect(response.headers.get('cdn-cache-control')).toBe(spotifyCache.cdn);
    expect(await response.json()).toEqual({ ok: true });
  });

  it('returns a bodyless HEAD response with the same public headers', async () => {
    const response = jsonForMethod('HEAD', { ignored: true }, 200, githubCache);
    expect(response.headers.get('cdn-cache-control')).toBe(githubCache.cdn);
    expect(await response.text()).toBe('');
  });
});
