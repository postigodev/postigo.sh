import { describe, expect, it } from 'vitest';
import type { Writing } from './domain';
import { buildWritingMetadata } from './metadata';

function writing(overrides: Partial<Writing> = {}): Writing {
  return {
    id: 'writing-id',
    slug: 'systems-paper',
    title: 'Systems Paper',
    subtitle: 'A subtitle',
    description: null,
    excerpt: 'Excerpt fallback',
    contentMarkdown: '# Paper',
    type: 'paper',
    language: 'en-US',
    status: 'published',
    authors: [{ name: 'Piero', url: 'https://example.com/piero' }],
    tags: ['systems'],
    topics: ['architecture'],
    canonicalUrl: null,
    seoTitle: null,
    seoDescription: null,
    ogImageUrl: null,
    pdf: {
      url: 'https://blob.example/private-implementation-url.pdf',
      pathname: 'writings/writing-id/paper-random.pdf',
      filename: 'paper.pdf',
      size: 100,
      mimeType: 'application/pdf',
    },
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-02-01T00:00:00.000Z'),
    publishedAt: new Date('2026-01-15T00:00:00.000Z'),
    ...overrides,
  };
}

describe('buildWritingMetadata', () => {
  it('builds scholarly metadata and exposes only the stable PDF route', () => {
    const metadata = buildWritingMetadata(writing(), {
      siteUrl: 'https://portfolio.example/base/',
    });

    expect(metadata.title).toBe('Systems Paper');
    expect(metadata.description).toBe('Excerpt fallback');
    expect(metadata.canonicalUrl).toBe(
      'https://portfolio.example/writings/systems-paper',
    );
    expect(metadata.jsonLd).toMatchObject({
      '@type': 'ScholarlyArticle',
      datePublished: '2026-01-15T00:00:00.000Z',
      encoding: {
        contentUrl:
          'https://portfolio.example/writings/systems-paper/paper.pdf',
      },
    });
    expect(JSON.stringify(metadata)).not.toContain('blob.example');
  });

  it('honors SEO and canonical overrides and uses Article otherwise', () => {
    const metadata = buildWritingMetadata(
      writing({
        type: 'essay',
        seoTitle: 'SEO title',
        seoDescription: 'SEO description',
        canonicalUrl: 'https://canonical.example/essay',
        pdf: null,
      }),
      { siteUrl: 'https://portfolio.example' },
    );

    expect(metadata).toMatchObject({
      title: 'SEO title',
      description: 'SEO description',
      canonicalUrl: 'https://canonical.example/essay',
      jsonLd: { '@type': 'Article' },
    });
    expect(metadata.jsonLd).not.toHaveProperty('encoding');
  });
});
