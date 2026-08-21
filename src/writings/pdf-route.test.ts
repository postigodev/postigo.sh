import { describe, expect, it, vi } from 'vitest';
import type { Writing } from './domain';
import type { WritingPdfBody, WritingPdfHead } from './pdf-storage';
import {
  resolvePublishedWritingPdf,
  type WritingPdfRouteDependencies,
} from '../pages/writings/[slug]/paper.pdf';

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
    url: 'https://private.blob.vercel-storage.com/writings/paper.pdf',
    pathname: 'writings/paper.pdf',
    filename: 'paper.pdf',
    size: 12,
    mimeType: 'application/pdf',
  },
  createdAt: new Date('2026-08-20T00:00:00Z'),
  updatedAt: new Date('2026-08-20T00:00:00Z'),
  publishedAt: new Date('2026-08-20T00:00:00Z'),
};

function pdfStream(text = '%PDF-private'): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(text));
      controller.close();
    },
  });
}

function routeDependencies(
  overrides: Partial<WritingPdfRouteDependencies> = {},
): WritingPdfRouteDependencies {
  const metadata: WritingPdfHead = {
    size: 12,
    contentDisposition: 'inline; filename="paper.pdf"',
  };
  return {
    getWriting: vi.fn(async () => publishedWriting),
    getBlobToken: vi.fn(async () => 'blob-token'),
    storage: {
      get: vi.fn(async (): Promise<WritingPdfBody> => ({
        ...metadata,
        stream: pdfStream(),
      })),
      head: vi.fn(async () => metadata),
    },
    ...overrides,
  };
}

describe('stable writing PDF response', () => {
  it('streams a private Blob through the same-origin GET response', async () => {
    const dependencies = routeDependencies();
    const response = await resolvePublishedWritingPdf(
      publishedWriting.slug,
      'GET',
      dependencies,
    );

    expect(dependencies.getWriting).toHaveBeenCalledWith(publishedWriting.slug);
    expect(dependencies.getBlobToken).toHaveBeenCalledOnce();
    expect(dependencies.storage.get).toHaveBeenCalledWith({
      pathname: publishedWriting.pdf?.pathname,
      token: 'blob-token',
    });
    expect(dependencies.storage.head).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('content-type')).toBe('application/pdf');
    expect(response.headers.get('content-length')).toBe('12');
    expect(response.headers.get('content-disposition')).toBe(
      'inline; filename="paper.pdf"',
    );
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect([...response.headers.values()].join('\n')).not.toContain(
      publishedWriting.pdf?.url ?? '',
    );
    expect(await response.text()).toBe('%PDF-private');
  });

  it('uses metadata-only Blob access and an empty body for HEAD', async () => {
    const dependencies = routeDependencies();
    const response = await resolvePublishedWritingPdf(
      publishedWriting.slug,
      'HEAD',
      dependencies,
    );

    expect(dependencies.storage.head).toHaveBeenCalledWith({
      pathname: publishedWriting.pdf?.pathname,
      token: 'blob-token',
    });
    expect(dependencies.storage.get).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('content-type')).toBe('application/pdf');
    expect(response.headers.get('content-length')).toBe('12');
    expect(await response.text()).toBe('');
  });

  it('cannot resolve the private artifact after the published query is revoked', async () => {
    let published = true;
    const dependencies = routeDependencies({
      getWriting: vi.fn(async () => (published ? publishedWriting : null)),
    });

    const visible = await resolvePublishedWritingPdf(
      publishedWriting.slug,
      'GET',
      dependencies,
    );
    published = false;
    const revoked = await resolvePublishedWritingPdf(
      publishedWriting.slug,
      'GET',
      dependencies,
    );

    expect(visible.status).toBe(200);
    expect(visible.headers.get('location')).toBeNull();
    expect(revoked.status).toBe(404);
    expect(revoked.headers.get('location')).toBeNull();
    expect(await revoked.text()).toBe('PDF not found.');
    expect(dependencies.storage.get).toHaveBeenCalledOnce();
    expect(dependencies.getBlobToken).toHaveBeenCalledOnce();
  });

  it('returns a non-cacheable 404 when publication, metadata, or the Blob is absent', async () => {
    const unpublished = routeDependencies({
      getWriting: vi.fn(async () => null),
    });
    const unpublishedResponse = await resolvePublishedWritingPdf(
      'draft-or-missing',
      'GET',
      unpublished,
    );

    expect(unpublishedResponse.status).toBe(404);
    expect(unpublishedResponse.headers.get('cache-control')).toBe('no-store');
    expect(await unpublishedResponse.text()).toBe('PDF not found.');
    expect(unpublished.getBlobToken).not.toHaveBeenCalled();
    expect(unpublished.storage.get).not.toHaveBeenCalled();

    const missingBlob = routeDependencies();
    vi.mocked(missingBlob.storage.get).mockResolvedValueOnce(null);
    const missingBlobResponse = await resolvePublishedWritingPdf(
      publishedWriting.slug,
      'GET',
      missingBlob,
    );
    expect(missingBlobResponse.status).toBe(404);
    expect(await missingBlobResponse.text()).toBe('PDF not found.');
  });

  it('returns a non-cacheable 503 without leaking private storage failures', async () => {
    const dependencies = routeDependencies({
      getBlobToken: vi.fn(async () => {
        throw new Error('private token failure');
      }),
    });
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const response = await resolvePublishedWritingPdf(
      publishedWriting.slug,
      'GET',
      dependencies,
    );

    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('location')).toBeNull();
    expect(await response.text()).toBe('PDF unavailable.');
    error.mockRestore();
  });
});
