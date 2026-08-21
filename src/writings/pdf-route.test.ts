import { describe, expect, it, vi } from 'vitest';
import type { Writing } from './domain';
import { resolvePublishedWritingPdf } from '../pages/writings/[slug]/paper.pdf';

const publishedWriting: Writing = {
  id: '00000000-0000-4000-8000-000000000001',
  slug: 'published-paper',
  title: 'Published paper',
  subtitle: null,
  description: null,
  excerpt: null,
  contentMarkdown: '# Published paper',
  type: 'paper',
  language: 'en-US',
  status: 'published',
  authors: [{ name: 'Piero' }],
  tags: [],
  topics: [],
  canonicalUrl: null,
  seoTitle: null,
  seoDescription: null,
  ogImageUrl: null,
  pdf: {
    url: 'https://portfolio-public.blob.vercel-storage.com/writings/paper.pdf',
    pathname: 'writings/paper.pdf',
    filename: 'paper.pdf',
    size: 1024,
    mimeType: 'application/pdf',
  },
  createdAt: new Date('2026-08-20T00:00:00Z'),
  updatedAt: new Date('2026-08-20T00:00:00Z'),
  publishedAt: new Date('2026-08-20T00:00:00Z'),
};

describe('stable writing PDF response', () => {
  it('redirects without caching the publication decision', async () => {
    const getWriting = vi.fn(async () => publishedWriting);
    const response = await resolvePublishedWritingPdf(
      publishedWriting.slug,
      getWriting,
    );

    expect(getWriting).toHaveBeenCalledWith(publishedWriting.slug);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(publishedWriting.pdf?.url);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(await response.text()).toBe('');
  });

  it('returns a non-cacheable 404 when publication or PDF metadata is absent', async () => {
    const response = await resolvePublishedWritingPdf(
      'draft-or-missing',
      vi.fn(async () => null),
    );

    expect(response.status).toBe(404);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.text()).toBe('PDF not found.');
  });
});
