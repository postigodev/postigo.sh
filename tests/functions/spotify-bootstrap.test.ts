import { describe, expect, it } from 'vitest';
import { buildAuthorizeUrl, validateCallback } from '../../scripts/spotify-bootstrap.mjs';

describe('Spotify owner bootstrap', () => {
  it('builds a fixed-scope authorization URL with a single-use state', () => {
    const url = buildAuthorizeUrl({ clientId: 'client', state: 'nonce' });
    expect(url.origin + url.pathname).toBe('https://accounts.spotify.com/authorize');
    expect(url.searchParams.get('redirect_uri')).toBe('http://127.0.0.1:43821/callback');
    expect(url.searchParams.get('scope')).toBe('user-read-currently-playing user-read-recently-played');
    expect(url.searchParams.get('state')).toBe('nonce');
    expect(url.searchParams.get('response_type')).toBe('code');
  });

  it('accepts only the fixed callback path and matching state', () => {
    expect(validateCallback(new URL('http://127.0.0.1:43821/callback?code=x&state=expected'), 'expected')).toBe('x');
    expect(() => validateCallback(new URL('http://127.0.0.1:43821/other?code=x&state=expected'), 'expected'))
      .toThrow('invalid callback path');
  });

  it('rejects a callback whose state differs', () => {
    expect(() => validateCallback(new URL('http://127.0.0.1:43821/callback?code=x&state=wrong'), 'expected'))
      .toThrow('state mismatch');
  });

  it('rejects denial and missing authorization codes', () => {
    expect(() => validateCallback(new URL('http://127.0.0.1:43821/callback?error=access_denied&state=x'), 'x'))
      .toThrow('authorization denied');
    expect(() => validateCallback(new URL('http://127.0.0.1:43821/callback?state=x'), 'x'))
      .toThrow('authorization code missing');
  });
});
