import { BlobError } from '@vercel/blob';
import { describe, expect, it, vi } from 'vitest';
import { ServerConfigurationError } from '../lib/server-env';
import type { Writing, WritingServiceWarning } from '../writings/domain';
import { WritingSlugConflictError } from '../writings/service';
import {
  createWritingActionHandlers,
  WritingActionFailure,
  type WritingActionDependencies,
  type WritingActionServices,
} from './writing-handlers';
import { parseAuthors, parseNullableText, parseStringList } from './writing-input';

const writing: Writing = {
  id: 'writing-1',
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

const validWritingInput = {
  slug: 'writing-one',
  title: 'Writing one',
  subtitle: null,
  description: null,
  excerpt: null,
  contentMarkdown: '# Writing one',
  type: 'essay' as const,
  language: 'en',
  authors: 'Piero|https://example.com/piero\nSecond Author',
  tags: 'astro, auth',
  topics: ['portfolio', 'security'],
  canonicalUrl: null,
  seoTitle: null,
  seoDescription: null,
  ogImageUrl: null,
};

const context = { request: { headers: new Headers({ cookie: 'session=x' }) } };

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
    expect(parseAuthors('Piero|https://example.com\nSecond Author')).toEqual([
      { name: 'Piero', url: 'https://example.com' },
      { name: 'Second Author' },
    ]);
    expect(parseAuthors('[{"name":"One"},{"name":"Two","url":"https://two.example"}]')).toEqual([
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
  it('authorizes first for every mutation and never calls a service when signed out', async () => {
    const services = serviceDoubles();
    const authorize = vi.fn(async () => ({ status: 'unauthenticated' as const }));
    const getBlobToken = vi.fn(async () => 'blob-token');
    const handlers = createWritingActionHandlers({
      authorize,
      getBlobToken,
      services,
    });
    const pdf = new File(['%PDF-1.7'], 'paper.pdf', { type: 'application/pdf' });
    const calls = [
      () => handlers.createWriting(validWritingInput, context),
      () => handlers.updateWriting({ id: writing.id, ...validWritingInput }, context),
      () => handlers.publishWriting({ id: writing.id }, context),
      () => handlers.unpublishWriting({ id: writing.id }, context),
      () => handlers.deleteWriting({ id: writing.id, expectedSlug: writing.slug }, context),
      () => handlers.uploadWritingPdf({ id: writing.id, file: pdf }, context),
      () => handlers.removeWritingPdf({ id: writing.id }, context),
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

    await expect(
      handlers.publishWriting({ id: writing.id }, context),
    ).rejects.toEqual(expectFailure('FORBIDDEN'));
  });
});

describe('writing action service delegation', () => {
  it('uses dedicated publish and unpublish services and cannot smuggle status through edits', async () => {
    const dependencies = actionDependencies();
    const handlers = createWritingActionHandlers(dependencies);

    await handlers.createWriting(
      { ...validWritingInput, status: 'published' } as typeof validWritingInput,
      context,
    );
    await handlers.updateWriting(
      {
        id: writing.id,
        ...validWritingInput,
        status: 'published',
      } as typeof validWritingInput & { id: string },
      context,
    );
    await handlers.publishWriting({ id: writing.id }, context);
    await handlers.unpublishWriting({ id: writing.id }, context);

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
    const services = serviceDoubles({
      deleteWriting: vi.fn(async () => ({ data: writing, warnings: [warning] })),
    });
    const handlers = createWritingActionHandlers(actionDependencies({ services }));

    await expect(
      handlers.deleteWriting(
        { id: writing.id, expectedSlug: 'wrong-slug' },
        context,
      ),
    ).rejects.toEqual(expectFailure('PRECONDITION_FAILED'));
    expect(services.deleteWriting).not.toHaveBeenCalled();

    await expect(
      handlers.deleteWriting(
        { id: writing.id, expectedSlug: writing.slug },
        context,
      ),
    ).resolves.toEqual({
      data: writing,
      warnings: [{ code: warning.code, message: warning.message }],
    });
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
      handlers.uploadWritingPdf({ id: writing.id, file }, context),
    ).resolves.toEqual({
      data: writing,
      warnings: [{ code: warning.code, message: warning.message }],
    });
  });
});

describe('writing action error mapping', () => {
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
      conflictHandlers.createWriting(validWritingInput, context),
    ).rejects.toEqual(expectFailure('CONFLICT'));

    const notFoundHandlers = createWritingActionHandlers(
      actionDependencies({
        services: serviceDoubles({ publishWriting: vi.fn(async () => null) }),
      }),
    );
    await expect(
      notFoundHandlers.publishWriting({ id: 'missing' }, context),
    ).rejects.toEqual(expectFailure('NOT_FOUND'));

    await expect(
      conflictHandlers.createWriting(
        { ...validWritingInput, authors: '[invalid' },
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
    await expect(
      configHandlers.removeWritingPdf({ id: writing.id }, context),
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
    const file = new File(['%PDF-1.7'], 'paper.pdf', { type: 'application/pdf' });
    await expect(
      blobHandlers.uploadWritingPdf({ id: writing.id, file }, context),
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
      .updateWriting({ id: writing.id, ...validWritingInput }, context)
      .catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(WritingActionFailure);
    expect(failure).toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
      cause,
    });
  });
});
