import { describe, expect, it } from 'vitest';
import type { WritingSummary as DomainWritingSummary } from '../writings/domain';
import {
  getPublishedWritings,
  projectWritingSummary,
  type WritingSummary,
} from './writings';

describe('published writing projection', () => {
  it('is typed and honestly empty until local writing exists', () => {
    const writings: readonly WritingSummary[] = getPublishedWritings();
    expect(writings).toEqual([]);
  });

  it('preserves the compact string-dated public contract', () => {
    const domainSummary: DomainWritingSummary = {
      id: 'writing-id',
      slug: 'projected-writing',
      title: 'Projected writing',
      summary: 'A concise summary.',
      type: 'article',
      language: 'en-US',
      authors: [{ name: 'Piero' }],
      tags: ['web'],
      topics: ['architecture'],
      publishedAt: new Date('2026-08-20T12:00:00.000Z'),
    };

    const projected: WritingSummary = projectWritingSummary(domainSummary);
    expect(projected).toEqual({
      slug: 'projected-writing',
      title: 'Projected writing',
      summary: 'A concise summary.',
      publishedAt: '2026-08-20T12:00:00.000Z',
    });
    expect(Object.keys(projected)).toEqual([
      'slug',
      'title',
      'summary',
      'publishedAt',
    ]);
  });
});
