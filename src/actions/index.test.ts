import { ActionError } from 'astro:actions';
import { describe, expect, it, vi } from 'vitest';
import type { Writing } from '../writings/domain';
import { createAstroWritingActions } from './index';
import {
  createWritingActionHandlers,
  type WritingActionDependencies,
  type WritingActionServices,
} from './writing-handlers';

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

function serviceDoubles(): WritingActionServices {
  return {
    createWriting: vi.fn(async () => writing),
    updateWriting: vi.fn(async () => writing),
    publishWriting: vi.fn(async () => writing),
    unpublishWriting: vi.fn(async () => writing),
    getWritingById: vi.fn(async () => writing),
    deleteWriting: vi.fn(async () => ({ data: writing, warnings: [] })),
    attachWritingPdf: vi.fn(async () => ({ data: writing, warnings: [] })),
    removeWritingPdf: vi.fn(async () => ({ data: writing, warnings: [] })),
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

const context = { request: { headers: new Headers() } };

function invokeAction<T>(
  action: { orThrow(input: FormData): Promise<T> },
  input: FormData,
): Promise<T> {
  return action.orThrow.call(context, input);
}

describe('Astro writing action wrapper', () => {
  it('authorizes malformed raw FormData before validation', async () => {
    const authorize = vi.fn(async () => ({ status: 'unauthenticated' as const }));
    const handlers = createWritingActionHandlers(
      actionDependencies({ authorize }),
    );
    const actions = createAstroWritingActions(handlers);

    const failure = await invokeAction(actions.createWriting, new FormData()).catch(
      (error: unknown) => error,
    );

    expect(authorize).toHaveBeenCalledOnce();
    expect(failure).toBeInstanceOf(ActionError);
    expect(failure).toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('preserves repeated author, tag, and topic fields end to end', async () => {
    const services = serviceDoubles();
    const handlers = createWritingActionHandlers(
      actionDependencies({ services }),
    );
    const actions = createAstroWritingActions(handlers);
    const form = new FormData();
    form.set('title', 'Writing one');
    form.set('contentMarkdown', '# Writing one');
    form.set('type', 'essay');
    form.set('language', 'en');
    form.append('authors', 'Piero|https://example.com/piero');
    form.append('authors', 'Second Author');
    form.append('tags', 'astro');
    form.append('tags', 'auth, security');
    form.append('topics', 'portfolio');
    form.append('topics', 'personal web');

    await invokeAction(actions.createWriting, form);

    expect(services.createWriting).toHaveBeenCalledWith(
      expect.objectContaining({
        authors: [
          { name: 'Piero', url: 'https://example.com/piero' },
          { name: 'Second Author' },
        ],
        tags: ['astro', 'auth', 'security'],
        topics: ['portfolio', 'personal web'],
      }),
    );
  });
});
