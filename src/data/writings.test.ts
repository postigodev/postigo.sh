import { describe, expect, it, vi } from 'vitest';
import type { WritingSummary as DomainWritingSummary } from '../writings/domain';
import {
  getPublishedWritings,
  getPublishedWritingsOrFallback,
  projectWritingSummary,
  type WritingSummary,
} from './writings';

describe('published writing projection', () => {
  it('loads and projects the service result asynchronously', async () => {
    const writings: readonly WritingSummary[] = await getPublishedWritings({
      listPublished: vi.fn(async () => [domainSummary]),
      logger: { error: vi.fn() },
    });
    expect(writings).toEqual([
      {
        slug: 'projected-writing',
        title: 'Projected writing',
        summary: 'A concise summary.',
        publishedAt: '2026-08-20T12:00:00.000Z',
      },
    ]);
  });

  it('preserves the compact string-dated public contract', () => {
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

  it('reports an unavailable backend and returns an explicit fallback state', async () => {
    const logger = { error: vi.fn() };
    const cause = new Error('database unavailable');

    await expect(
      getPublishedWritingsOrFallback({
        listPublished: vi.fn(async () => Promise.reject(cause)),
        logger,
      }),
    ).resolves.toEqual({ writings: [], available: false });
    expect(logger.error).toHaveBeenCalledWith(
      'Unable to load published writings.',
      { cause },
    );
  });
});

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
