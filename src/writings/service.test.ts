import { describe, expect, it, vi } from 'vitest';
import type { WritingPdfMetadata } from './domain';
import type {
  NewWritingRecord,
  WritingRecord,
  WritingRecordUpdate,
  WritingRepository,
} from './repository';
import {
  createWritingService,
  WritingPdfAttachmentError,
  WritingSlugConflictError,
} from './service';

function record(overrides: Partial<WritingRecord> = {}): WritingRecord {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    slug: 'first-writing',
    title: 'First writing',
    subtitle: null,
    description: 'Description',
    excerpt: null,
    contentMarkdown: '# First',
    type: 'article',
    language: 'en-US',
    status: 'draft',
    authors: [{ name: 'Piero' }],
    tags: [],
    topics: [],
    canonicalUrl: null,
    seoTitle: null,
    seoDescription: null,
    ogImageUrl: null,
    pdfUrl: null,
    pdfPathname: null,
    pdfFilename: null,
    pdfSize: null,
    pdfMimeType: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    publishedAt: null,
    ...overrides,
  };
}

function repository(initialRows: WritingRecord[] = []) {
  const rows = [...initialRows];
  const repo: WritingRepository = {
    listPublished: vi.fn(async () =>
      rows.filter((row) => row.status === 'published'),
    ),
    listForAdmin: vi.fn(async () => rows),
    getPublishedBySlug: vi.fn(async (slug) =>
      rows.find((row) => row.slug === slug && row.status === 'published') ?? null,
    ),
    getById: vi.fn(async (id) => rows.find((row) => row.id === id) ?? null),
    create: vi.fn(async (values: NewWritingRecord) => {
      const created = record({
        ...values,
        id: '00000000-0000-4000-8000-000000000099',
        createdAt: new Date('2026-03-01T00:00:00.000Z'),
        updatedAt: new Date('2026-03-01T00:00:00.000Z'),
      });
      rows.push(created);
      return created;
    }),
    update: vi.fn(async (id: string, values: WritingRecordUpdate) => {
      const index = rows.findIndex((row) => row.id === id);
      if (index < 0) return null;
      rows[index] = { ...rows[index], ...values } as WritingRecord;
      return rows[index];
    }),
    publish: vi.fn(async (id: string, publishedAt: Date) => {
      await Promise.resolve();
      const index = rows.findIndex((row) => row.id === id);
      if (index < 0) return null;
      const current = rows[index] as WritingRecord;
      rows[index] = {
        ...current,
        status: 'published',
        publishedAt: current.publishedAt ?? publishedAt,
      };
      return rows[index];
    }),
    unpublish: vi.fn(async (id: string) => {
      const index = rows.findIndex((row) => row.id === id);
      if (index < 0) return null;
      rows[index] = { ...rows[index], status: 'draft' } as WritingRecord;
      return rows[index];
    }),
    delete: vi.fn(async (id) => {
      const index = rows.findIndex((row) => row.id === id);
      if (index < 0) return null;
      return rows.splice(index, 1)[0] ?? null;
    }),
  };
  return { repo, rows };
}

const input = {
  title: 'New Writing',
  contentMarkdown: '# New',
  type: 'article' as const,
  language: 'es-pe',
  authors: [{ name: 'Piero' }],
};

const pdf: WritingPdfMetadata = {
  url: 'https://blob.example/new.pdf',
  pathname: 'writings/id/paper-new.pdf',
  filename: 'paper.pdf',
  size: 12,
  mimeType: 'application/pdf',
};

function pdfFile() {
  return new File(['%PDF-content'], 'paper.pdf', {
    type: 'application/pdf',
  });
}

describe('writing service publication behavior', () => {
  it('sorts published summaries by publishedAt DESC and id deterministically', async () => {
    const sameDate = new Date('2026-03-02T00:00:00.000Z');
    const { repo } = repository([
      record({
        id: 'b',
        status: 'published',
        publishedAt: sameDate,
      }),
      record({
        id: 'old',
        status: 'published',
        publishedAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
      record({
        id: 'a',
        status: 'published',
        publishedAt: sameDate,
      }),
    ]);
    const service = createWritingService({ repository: repo });

    expect((await service.listPublishedWritings()).map(({ id }) => id)).toEqual([
      'a',
      'b',
      'old',
    ]);
  });

  it('only resolves published writings by normalized slug but gets drafts by id', async () => {
    const draft = record({ slug: 'draft-post' });
    const published = record({
      id: 'published',
      slug: 'hello-world',
      status: 'published',
      publishedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const { repo } = repository([draft, published]);
    const service = createWritingService({ repository: repo });

    await expect(service.getPublishedWritingBySlug(' Hello World ')).resolves.toMatchObject({
      id: 'published',
    });
    await expect(service.getPublishedWritingBySlug('draft-post')).resolves.toBeNull();
    await expect(service.getWritingById(draft.id)).resolves.toMatchObject({
      status: 'draft',
    });
    await expect(service.listWritingsForAdmin()).resolves.toHaveLength(2);
  });

  it('publishes once and preserves publishedAt through dedicated unpublish and republish calls', async () => {
    const firstPublish = new Date('2026-03-01T00:00:00.000Z');
    const later = new Date('2026-04-01T00:00:00.000Z');
    const draft = record();
    const { repo } = repository([draft]);
    const now = vi.fn(() => firstPublish);
    const service = createWritingService({ repository: repo, now });

    const published = await service.publishWriting(draft.id);
    expect(published?.publishedAt).toBe(firstPublish);
    expect(published?.status).toBe('published');

    const unpublished = await service.unpublishWriting(draft.id);
    expect(unpublished).toMatchObject({
      status: 'draft',
      publishedAt: firstPublish,
    });
    now.mockReturnValue(later);
    const republished = await service.publishWriting(draft.id);
    expect(republished?.publishedAt).toBe(firstPublish);
    expect(republished?.status).toBe('published');
    expect(now).toHaveBeenCalledTimes(2);
    expect(repo.getById).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('preserves the first timestamp across concurrent publish requests', async () => {
    const firstPublish = new Date('2026-03-01T00:00:00.000Z');
    const competingPublish = new Date('2026-03-01T00:00:01.000Z');
    const draft = record();
    const { repo } = repository([draft]);
    const now = vi
      .fn<() => Date>()
      .mockReturnValueOnce(firstPublish)
      .mockReturnValueOnce(competingPublish);
    const service = createWritingService({ repository: repo, now });

    const [first, second] = await Promise.all([
      service.publishWriting(draft.id),
      service.publishWriting(draft.id),
    ]);

    expect(first?.publishedAt).toBe(firstPublish);
    expect(second?.publishedAt).toBe(firstPublish);
    expect(repo.publish).toHaveBeenNthCalledWith(1, draft.id, firstPublish);
    expect(repo.publish).toHaveBeenNthCalledWith(2, draft.id, competingPublish);
    expect(repo.getById).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('returns null from dedicated publication APIs when the writing does not exist', async () => {
    const { repo } = repository();
    const service = createWritingService({ repository: repo });

    await expect(service.publishWriting('missing')).resolves.toBeNull();
    await expect(service.unpublishWriting('missing')).resolves.toBeNull();
    expect(repo.publish).toHaveBeenCalledOnce();
    expect(repo.unpublish).toHaveBeenCalledOnce();
    expect(repo.getById).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('sets publishedAt for newly created published writings and canonicalizes input', async () => {
    const timestamp = new Date('2026-05-01T00:00:00.000Z');
    const { repo } = repository();
    const service = createWritingService({ repository: repo, now: () => timestamp });

    const created = await service.createWriting({ ...input, status: 'published' });
    expect(created).toMatchObject({
      slug: 'new-writing',
      language: 'es-PE',
      status: 'published',
      publishedAt: timestamp,
    });
  });

  it('converts Postgres 23505 failures into explicit slug conflicts', async () => {
    const { repo } = repository([record()]);
    vi.mocked(repo.create).mockRejectedValueOnce({ code: '23505' });
    vi.mocked(repo.update).mockRejectedValueOnce({
      cause: { code: '23505' },
    });
    const service = createWritingService({ repository: repo });

    await expect(
      service.createWriting({ ...input, slug: 'Taken Slug' }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<WritingSlugConflictError>>({
        name: 'WritingSlugConflictError',
        slug: 'taken-slug',
      }),
    );
    await expect(
      service.updateWriting('00000000-0000-4000-8000-000000000001', {
        slug: 'Another Taken Slug',
      }),
    ).rejects.toBeInstanceOf(WritingSlugConflictError);
  });
});

describe('writing service PDF lifecycle', () => {
  it('uploads, saves metadata, then deletes the old blob', async () => {
    const existing = record({
      pdfUrl: 'https://blob.example/old.pdf',
      pdfPathname: 'writings/id/paper-old.pdf',
      pdfFilename: 'old.pdf',
      pdfSize: 10,
      pdfMimeType: 'application/pdf',
    });
    const { repo } = repository([existing]);
    const calls: string[] = [];
    const storage = {
      upload: vi.fn(async () => {
        calls.push('upload');
        return pdf;
      }),
      delete: vi.fn(async () => {
        calls.push('delete-old');
      }),
    };
    vi.mocked(repo.update).mockImplementation(async (id, values) => {
      calls.push('db-update');
      return { ...existing, ...values, id } as WritingRecord;
    });
    const service = createWritingService({ repository: repo, pdfStorage: storage });

    const result = await service.attachWritingPdf(existing.id, pdfFile(), {
      token: 'token',
    });

    expect(calls).toEqual(['upload', 'db-update', 'delete-old']);
    expect(result.data.pdf).toEqual(pdf);
    expect(result.warnings).toEqual([]);
  });

  it('cleans the new blob when the metadata update fails', async () => {
    const existing = record();
    const { repo } = repository([existing]);
    const databaseError = new Error('database unavailable');
    vi.mocked(repo.update).mockRejectedValue(databaseError);
    const storage = {
      upload: vi.fn(async () => pdf),
      delete: vi.fn(async () => undefined),
    };
    const service = createWritingService({ repository: repo, pdfStorage: storage });

    await expect(
      service.attachWritingPdf(existing.id, pdfFile(), { token: 'token' }),
    ).rejects.toMatchObject({
      name: 'WritingPdfAttachmentError',
      cause: databaseError,
    });
    expect(storage.delete).toHaveBeenCalledWith({
      pathname: pdf.pathname,
      token: 'token',
    });
  });

  it('reports and logs cleanup failures without rolling back saved metadata', async () => {
    const existing = record({
      pdfUrl: 'https://blob.example/old.pdf',
      pdfPathname: 'writings/id/paper-old.pdf',
      pdfFilename: 'old.pdf',
      pdfSize: 10,
      pdfMimeType: 'application/pdf',
    });
    const { repo } = repository([existing]);
    const storage = {
      upload: vi.fn(async () => pdf),
      delete: vi.fn(async () => {
        throw new Error('blob unavailable');
      }),
    };
    const logger = { warn: vi.fn() };
    const service = createWritingService({
      repository: repo,
      pdfStorage: storage,
      logger,
    });

    const result = await service.attachWritingPdf(existing.id, pdfFile(), {
      token: 'token',
    });
    expect(result.data.pdf).toEqual(pdf);
    expect(result.warnings).toMatchObject([{ code: 'old_pdf_cleanup_failed' }]);
    expect(logger.warn).toHaveBeenCalledOnce();
  });

  it('clears or deletes database state before best-effort blob cleanup', async () => {
    const withPdf = record({
      pdfUrl: pdf.url,
      pdfPathname: pdf.pathname,
      pdfFilename: pdf.filename,
      pdfSize: pdf.size,
      pdfMimeType: pdf.mimeType,
    });
    const removal = repository([withPdf]);
    const removalCalls: string[] = [];
    vi.mocked(removal.repo.update).mockImplementation(async (id, values) => {
      removalCalls.push('db-clear');
      return { ...withPdf, ...values, id } as WritingRecord;
    });
    const failingStorage = {
      upload: vi.fn(async () => pdf),
      delete: vi.fn(async () => {
        removalCalls.push('blob-delete');
        throw new Error('cleanup failed');
      }),
    };
    const logger = { warn: vi.fn() };
    const removeService = createWritingService({
      repository: removal.repo,
      pdfStorage: failingStorage,
      logger,
    });

    const removed = await removeService.removeWritingPdf(withPdf.id, {
      token: 'token',
    });
    expect(removalCalls).toEqual(['db-clear', 'blob-delete']);
    expect(removed.data?.pdf).toBeNull();
    expect(removed.warnings[0]?.code).toBe('removed_pdf_cleanup_failed');

    const deletion = repository([withPdf]);
    const deleted = await createWritingService({
      repository: deletion.repo,
      pdfStorage: failingStorage,
      logger,
    }).deleteWriting(withPdf.id, { token: 'token' });
    expect(deletion.rows).toEqual([]);
    expect(deleted.warnings[0]?.code).toBe(
      'deleted_writing_pdf_cleanup_failed',
    );
  });

  it('surfaces cleanup failure details on failed attachments', async () => {
    const existing = record();
    const { repo } = repository([existing]);
    vi.mocked(repo.update).mockRejectedValue(new Error('db failed'));
    const service = createWritingService({
      repository: repo,
      pdfStorage: {
        upload: vi.fn(async () => pdf),
        delete: vi.fn(async () => {
          throw new Error('cleanup failed');
        }),
      },
      logger: { warn: vi.fn() },
    });

    const error = await service
      .attachWritingPdf(existing.id, pdfFile(), { token: 'token' })
      .catch((cause: unknown) => cause);
    expect(error).toBeInstanceOf(WritingPdfAttachmentError);
    expect((error as WritingPdfAttachmentError).warnings).toMatchObject([
      { code: 'new_pdf_cleanup_failed' },
    ]);
  });
});
