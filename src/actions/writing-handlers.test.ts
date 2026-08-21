import { BlobError } from '@vercel/blob';
import { describe, expect, it, vi } from 'vitest';
import { ServerConfigurationError } from '../lib/server-env';
import type {
  Writing,
  WritingPdfMetadata,
  WritingServiceWarning,
} from '../writings/domain';
import { WritingSlugConflictError } from '../writings/service';
import {
  createWritingActionHandlers,
  WritingActionFailure,
  type WritingActionDependencies,
  type WritingActionServices,
} from './writing-handlers';
import { parseAuthors, parseNullableText, parseStringList } from './writing-input';

const writing: Writing = {
  id: '00000000-0000-4000-8000-000000000001',
  slug: 'writing-one',
  title: 'Writing one',
  subtitle: null,
  description: null,
  excerpt: null,
  contentMarkdown: '# Writing one',
  type: 'essay',
  language: 'en',
  status: 'draft',
  authors: [{ name: 'Piero' }],
  tags: [],
  topics: [],
  canonicalUrl: null,
  seoTitle: null,
  seoDescription: null,
  ogImageUrl: null,
  pdf: null,
  createdAt: new Date('2026-08-20T00:00:00Z'),
  updatedAt: new Date('2026-08-20T00:00:00Z'),
  publishedAt: null,
};

const pdf: WritingPdfMetadata = {
  url: 'https://blob.example/paper.pdf',
  pathname: 'writings/writing-1/paper.pdf',
  filename: 'paper.pdf',
  size: 8,
  mimeType: 'application/pdf',
};

const context = { request: { headers: new Headers({ cookie: 'session=x' }) } };

function writingForm(options: {
  id?: string;
  authors?: string[];
  status?: string;
} = {}): FormData {
  const form = new FormData();
  if (options.id !== undefined) form.set('id', options.id);
  form.set('slug', 'writing-one');
  form.set('title', 'Writing one');
  form.set('contentMarkdown', '# Writing one');
  form.set('type', 'essay');
  form.set('language', 'en');
  for (const author of options.authors ?? [
    'Piero|https://example.com/piero',
    'Second Author',
  ]) {
    form.append('authors', author);
  }
  form.append('tags', 'astro, auth');
  form.append('topics', 'portfolio');
  form.append('topics', 'security');
  if (options.status) form.set('status', options.status);
  return form;
}

function idForm(id = writing.id): FormData {
  const form = new FormData();
  form.set('id', id);
  return form;
}

function deleteForm(expectedSlug: string, id = writing.id): FormData {
  const form = idForm(id);
  form.set('expectedSlug', expectedSlug);
  return form;
}

function pdfForm(file: File, id = writing.id): FormData {
  const form = idForm(id);
  form.set('file', file);
  return form;
}

function serviceDoubles(
  overrides: Partial<WritingActionServices> = {},
): WritingActionServices {
  return {
    createWriting: vi.fn(async () => writing),
    updateWriting: vi.fn(async () => writing),
    publishWriting: vi.fn(async () => ({
      ...writing,
      status: 'published' as const,
      publishedAt: new Date('2026-08-20T01:00:00Z'),
    })),
    unpublishWriting: vi.fn(async () => writing),
    getWritingById: vi.fn(async () => writing),
    deleteWriting: vi.fn(async () => ({ data: writing, warnings: [] })),
    attachWritingPdf: vi.fn(async () => ({ data: writing, warnings: [] })),
    removeWritingPdf: vi.fn(async () => ({ data: writing, warnings: [] })),
    ...overrides,
  };
}

function actionDependencies(
  overrides: Partial<WritingActionDependencies> = {},
): WritingActionDependencies {
  return {
    authorize: vi.fn(async () => ({
      status: 'authorized' as const,
      session: {
        user: { email: 'admin@example.com' },
        session: { id: 'session-1' },
      },
    })),
    getBlobToken: vi.fn(async () => 'blob-token'),
    services: serviceDoubles(),
    ...overrides,
  };
}

function expectFailure(code: string) {
  return expect.objectContaining({ name: 'WritingActionFailure', code });
}

describe('writing action input parsing', () => {
  it('supports multiple authors with optional URLs and flexible lists', () => {
    expect(
      parseAuthors(['Piero|https://example.com', 'Second Author']),
    ).toEqual([
      { name: 'Piero', url: 'https://example.com' },
      { name: 'Second Author' },
    ]);
    expect(
      parseAuthors([
        '[{"name":"One"},{"name":"Two","url":"https://two.example"}]',
      ]),
    ).toEqual([
      { name: 'One' },
      { name: 'Two', url: 'https://two.example' },
    ]);
    expect(parseStringList(['one, two', 'three'])).toEqual([
      'one',
      'two',
      'three',
    ]);
    expect(parseNullableText('   ')).toBeNull();
  });
});

describe('writing action authorization boundary', () => {
  it('authorizes first for every mutation and never parses or calls services when signed out', async () => {
    const services = serviceDoubles();
    const authorize = vi.fn(async () => ({ status: 'unauthenticated' as const }));
    const getBlobToken = vi.fn(async () => 'blob-token');
    const handlers = createWritingActionHandlers({
      authorize,
      getBlobToken,
      services,
    });
    const malformed = new FormData();
    const calls = [
      () => handlers.createWriting(malformed, context),
      () => handlers.updateWriting(malformed, context),
      () => handlers.publishWriting(malformed, context),
      () => handlers.unpublishWriting(malformed, context),
      () => handlers.deleteWriting(malformed, context),
      () => handlers.uploadWritingPdf(malformed, context),
      () => handlers.removeWritingPdf(malformed, context),
    ];

    for (const call of calls) {
      await expect(call()).rejects.toEqual(expectFailure('UNAUTHORIZED'));
    }

    expect(authorize).toHaveBeenCalledTimes(calls.length);
    expect(getBlobToken).not.toHaveBeenCalled();
    for (const service of Object.values(services)) {
      expect(service).not.toHaveBeenCalled();
    }
  });

  it('rejects an authenticated non-admin distinctly', async () => {
    const handlers = createWritingActionHandlers(
      actionDependencies({
        authorize: vi.fn(async () => ({
          status: 'forbidden' as const,
          session: {
            user: { email: 'someone@example.com' },
            session: { id: 'session-1' },
          },
        })),
      }),
    );

    await expect(handlers.publishWriting(new FormData(), context)).rejects.toEqual(
      expectFailure('FORBIDDEN'),
    );
  });
});

describe('writing action service delegation', () => {
  it('uses dedicated publish and unpublish services and cannot smuggle status through edits', async () => {
    const dependencies = actionDependencies();
    const handlers = createWritingActionHandlers(dependencies);

    await handlers.createWriting(writingForm({ status: 'published' }), context);
    await handlers.updateWriting(
      writingForm({ id: writing.id, status: 'published' }),
      context,
    );
    await handlers.publishWriting(idForm(), context);
    await handlers.unpublishWriting(idForm(), context);

    expect(dependencies.services.createWriting).toHaveBeenCalledWith(
      expect.not.objectContaining({ status: expect.anything() }),
    );
    expect(dependencies.services.updateWriting).toHaveBeenCalledWith(
      writing.id,
      expect.not.objectContaining({ status: expect.anything() }),
    );
    expect(dependencies.services.publishWriting).toHaveBeenCalledWith(writing.id);
    expect(dependencies.services.unpublishWriting).toHaveBeenCalledWith(writing.id);
  });

  it('requires the expected slug and surfaces delete cleanup warnings', async () => {
    const warning: WritingServiceWarning = {
      code: 'deleted_writing_pdf_cleanup_failed',
      message: 'Blob cleanup failed.',
      cause: new Error('private upstream detail'),
    };
    const writingWithPdf = { ...writing, pdf };
    const services = serviceDoubles({
      getWritingById: vi.fn(async () => writingWithPdf),
      deleteWriting: vi.fn(async () => ({
        data: writingWithPdf,
        warnings: [warning],
      })),
    });
    const handlers = createWritingActionHandlers(actionDependencies({ services }));

    await expect(
      handlers.deleteWriting(deleteForm('wrong-slug'), context),
    ).rejects.toEqual(expectFailure('PRECONDITION_FAILED'));
    expect(services.deleteWriting).not.toHaveBeenCalled();

    await expect(
      handlers.deleteWriting(deleteForm(writing.slug), context),
    ).resolves.toEqual({
      data: writingWithPdf,
      warnings: [{ code: warning.code, message: warning.message }],
    });
    expect(services.deleteWriting).toHaveBeenCalledWith(writing.id, {
      token: 'blob-token',
    });
  });

  it('does not require Blob configuration for delete or remove without a PDF', async () => {
    const services = serviceDoubles();
    const getBlobToken = vi.fn(async () => 'blob-token');
    const handlers = createWritingActionHandlers(
      actionDependencies({ services, getBlobToken }),
    );

    await handlers.deleteWriting(deleteForm(writing.slug), context);
    await handlers.removeWritingPdf(idForm(), context);

    expect(getBlobToken).not.toHaveBeenCalled();
    expect(services.deleteWriting).toHaveBeenCalledWith(writing.id, {});
    expect(services.removeWritingPdf).toHaveBeenCalledWith(writing.id, {});
  });

  it('surfaces PDF service warnings unchanged', async () => {
    const warning: WritingServiceWarning = {
      code: 'old_pdf_cleanup_failed',
      message: 'Old PDF cleanup failed.',
      cause: new Error('private upstream detail'),
    };
    const services = serviceDoubles({
      attachWritingPdf: vi.fn(async () => ({ data: writing, warnings: [warning] })),
    });
    const handlers = createWritingActionHandlers(actionDependencies({ services }));
    const file = new File(['%PDF-1.7'], 'paper.pdf', { type: 'application/pdf' });

    await expect(
      handlers.uploadWritingPdf(pdfForm(file), context),
    ).resolves.toEqual({
      data: writing,
      warnings: [{ code: warning.code, message: warning.message }],
    });
  });
});

describe('writing action validation and error mapping', () => {
  it('uses one UUID validator for every ID-bearing mutation', async () => {
    const services = serviceDoubles();
    const authorize = vi.fn(async () => ({
      status: 'authorized' as const,
      session: {
        user: { email: 'admin@example.com' },
        session: { id: 'session-1' },
      },
    }));
    const handlers = createWritingActionHandlers(
      actionDependencies({ services, authorize }),
    );
    const invalidId = 'not-a-uuid';
    const file = new File(['%PDF-1.7'], 'paper.pdf', { type: 'application/pdf' });
    const calls = [
      () => handlers.updateWriting(writingForm({ id: invalidId }), context),
      () => handlers.publishWriting(idForm(invalidId), context),
      () => handlers.unpublishWriting(idForm(invalidId), context),
      () => handlers.deleteWriting(deleteForm(writing.slug, invalidId), context),
      () => handlers.uploadWritingPdf(pdfForm(file, invalidId), context),
      () => handlers.removeWritingPdf(idForm(invalidId), context),
    ];

    for (const call of calls) {
      await expect(call()).rejects.toEqual(expectFailure('BAD_REQUEST'));
    }
    expect(authorize).toHaveBeenCalledTimes(calls.length);
    for (const service of Object.values(services)) {
      expect(service).not.toHaveBeenCalled();
    }
  });

  it('maps conflict, not-found, validation, config, and blob failures', async () => {
    const conflictHandlers = createWritingActionHandlers(
      actionDependencies({
        services: serviceDoubles({
          createWriting: vi.fn(async () => {
            throw new WritingSlugConflictError(writing.slug);
          }),
        }),
      }),
    );
    await expect(
      conflictHandlers.createWriting(writingForm(), context),
    ).rejects.toEqual(expectFailure('CONFLICT'));

    const notFoundHandlers = createWritingActionHandlers(
      actionDependencies({
        services: serviceDoubles({ publishWriting: vi.fn(async () => null) }),
      }),
    );
    await expect(
      notFoundHandlers.publishWriting(idForm(), context),
    ).rejects.toEqual(expectFailure('NOT_FOUND'));

    await expect(
      conflictHandlers.createWriting(
        writingForm({ authors: ['[invalid'] }),
        context,
      ),
    ).rejects.toEqual(expectFailure('BAD_REQUEST'));

    const configHandlers = createWritingActionHandlers(
      actionDependencies({
        getBlobToken: vi.fn(async () => {
          throw new ServerConfigurationError('writing PDF storage', [
            'BLOB_READ_WRITE_TOKEN is required.',
          ]);
        }),
      }),
    );
    const file = new File(['%PDF-1.7'], 'paper.pdf', { type: 'application/pdf' });
    await expect(
      configHandlers.uploadWritingPdf(pdfForm(file), context),
    ).rejects.toEqual(expectFailure('SERVICE_UNAVAILABLE'));

    const blobHandlers = createWritingActionHandlers(
      actionDependencies({
        services: serviceDoubles({
          attachWritingPdf: vi.fn(async () => {
            throw new BlobError('Blob upstream failed.');
          }),
        }),
      }),
    );
    await expect(
      blobHandlers.uploadWritingPdf(pdfForm(file), context),
    ).rejects.toEqual(expectFailure('BAD_GATEWAY'));
  });

  it('preserves the original cause on mapped failures', async () => {
    const cause = new Error('database offline');
    const handlers = createWritingActionHandlers(
      actionDependencies({
        services: serviceDoubles({
          updateWriting: vi.fn(async () => {
            throw cause;
          }),
        }),
      }),
    );

    const failure = await handlers
      .updateWriting(writingForm({ id: writing.id }), context)
      .catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(WritingActionFailure);
    expect(failure).toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
      cause,
    });
  });
});
