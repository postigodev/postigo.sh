import { describe, expect, it } from 'vitest';
import { letterboxdRssUrl } from './service';

describe('letterboxdRssUrl', () => {
  it('derives the bounded public feed from a profile URL', () => {
    expect(letterboxdRssUrl('https://letterboxd.com/postigovich/')).toBe('https://letterboxd.com/postigovich/rss/');
  });

  it('rejects non-Letterboxd and malformed profiles', () => {
    expect(letterboxdRssUrl('https://example.com/postigovich')).toBeUndefined();
    expect(letterboxdRssUrl('not a URL')).toBeUndefined();
  });
});

