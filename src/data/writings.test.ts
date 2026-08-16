import { describe, expect, it } from 'vitest';
import { getPublishedWritings, type WritingSummary } from './writings';

describe('published writing projection', () => {
  it('is typed and honestly empty until local writing exists', () => {
    const writings: readonly WritingSummary[] = getPublishedWritings();
    expect(writings).toEqual([]);
  });
});
