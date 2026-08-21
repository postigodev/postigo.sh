import type {
  CreateWritingInput,
  UpdateWritingInput,
  Writing,
  WritingPdfMetadata,
  WritingServiceResult,
  WritingServiceWarning,
  WritingSummary,
} from './domain';
import {
  vercelBlobWritingPdfStorage,
  type WritingPdfStorage,
} from './pdf-storage';
import {
  createDrizzleWritingRepository,
  type NewWritingRecord,
  type WritingRecord,
  type WritingRecordUpdate,
  type WritingRepository,
} from './repository';
import {
  createWritingSchema,
  normalizeWritingSlug,
  updateWritingSchema,
  validateWritingPdf,
  writingSlugSchema,
} from './schemas';

export interface WritingServiceLogger {
  warn(message: string, context?: Record<string, unknown>): void;
}

export interface WritingServiceDependencies {
  repository: WritingRepository;
  pdfStorage?: WritingPdfStorage;
  logger?: WritingServiceLogger;
  now?: () => Date;
}

export interface WritingPdfOperationOptions {
  token: string;
}

export class WritingSlugConflictError extends Error {
  readonly slug: string;

  constructor(slug: string, options?: ErrorOptions) {
    super(`A writing with the slug "${slug}" already exists.`, options);
    this.name = 'WritingSlugConflictError';
    this.slug = slug;
  }
}

export class WritingNotFoundError extends Error {
  readonly writingId: string;

  constructor(writingId: string) {
    super(`Writing "${writingId}" was not found.`);
    this.name = 'WritingNotFoundError';
    this.writingId = writingId;
  }
}

export class WritingPdfAttachmentError extends Error {
  readonly warnings: WritingServiceWarning[];

  constructor(cause: unknown, warnings: WritingServiceWarning[] = []) {
    super('The PDF was uploaded but its writing metadata could not be saved.', {
      cause,
    });
    this.name = 'WritingPdfAttachmentError';
    this.warnings = warnings;
  }
}

function pdfFromRecord(row: WritingRecord): WritingPdfMetadata | null {
  if (
    row.pdfUrl &&
    row.pdfPathname &&
    row.pdfFilename &&
    row.pdfSize !== null &&
    row.pdfMimeType === 'application/pdf'
  ) {
    return {
      url: row.pdfUrl,
      pathname: row.pdfPathname,
      filename: row.pdfFilename,
      size: row.pdfSize,
      mimeType: 'application/pdf',
    };
  }
  return null;
}

export function mapWritingRecord(row: WritingRecord): Writing {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    excerpt: row.excerpt,
    contentMarkdown: row.contentMarkdown,
    type: row.type,
    language: row.language,
    status: row.status,
    authors: row.authors.map((author) => ({ ...author })),
    tags: [...row.tags],
    topics: [...row.topics],
    canonicalUrl: row.canonicalUrl,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    ogImageUrl: row.ogImageUrl,
    pdf: pdfFromRecord(row),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    publishedAt: row.publishedAt,
  };
}

function toSummary(writing: Writing): WritingSummary {
  if (!writing.publishedAt) {
    throw new Error(`Published writing "${writing.id}" has no publication date.`);
  }
  return {
    id: writing.id,
    slug: writing.slug,
    title: writing.title,
    summary:
      writing.excerpt ??
      writing.description ??
      writing.subtitle ??
      writing.title,
    type: writing.type,
    language: writing.language,
    authors: writing.authors.map((author) => ({ ...author })),
    tags: [...writing.tags],
    topics: [...writing.topics],
    publishedAt: writing.publishedAt,
  };
}

function errorCode(error: unknown): unknown {
  let candidate = error;
  for (let depth = 0; depth < 5 && candidate; depth += 1) {
    if (typeof candidate !== 'object') return undefined;
    const record = candidate as Record<string, unknown>;
    if (record.code !== undefined) return record.code;
    candidate = record.cause;
  }
  return undefined;
}

function rethrowSlugConflict(error: unknown, slug: string): never {
  if (errorCode(error) === '23505') {
    throw new WritingSlugConflictError(slug, { cause: error });
  }
  throw error;
}

function pdfRecordUpdate(
  pdf: WritingPdfMetadata | null,
): WritingRecordUpdate {
  return {
    pdfUrl: pdf?.url ?? null,
    pdfPathname: pdf?.pathname ?? null,
    pdfFilename: pdf?.filename ?? null,
    pdfSize: pdf?.size ?? null,
    pdfMimeType: pdf?.mimeType ?? null,
  };
}

export function createWritingService({
  repository,
  pdfStorage = vercelBlobWritingPdfStorage,
  logger = console,
  now = () => new Date(),
}: WritingServiceDependencies) {
  function reportWarning(warning: WritingServiceWarning, writingId: string) {
    logger.warn(warning.message, {
      writingId,
      code: warning.code,
      cause: warning.cause,
    });
  }

  return {
    async listPublishedWritings(): Promise<WritingSummary[]> {
      return (await repository.listPublished())
        .map(mapWritingRecord)
        .map(toSummary)
        .sort(
          (left, right) =>
            right.publishedAt.getTime() - left.publishedAt.getTime() ||
            left.id.localeCompare(right.id),
        );
    },

    async listWritingsForAdmin(): Promise<Writing[]> {
      return (await repository.listForAdmin()).map(mapWritingRecord);
    },

    async getPublishedWritingBySlug(slug: string): Promise<Writing | null> {
      const normalizedSlug = writingSlugSchema.parse(slug);
      const row = await repository.getPublishedBySlug(normalizedSlug);
      return row ? mapWritingRecord(row) : null;
    },

    async getWritingById(id: string): Promise<Writing | null> {
      const row = await repository.getById(id);
      return row ? mapWritingRecord(row) : null;
    },

    async createWriting(input: CreateWritingInput): Promise<Writing> {
      const parsed = createWritingSchema.parse(input);
      const values: NewWritingRecord = {
        ...parsed,
        slug: parsed.slug ?? normalizeWritingSlug(parsed.title),
        subtitle: parsed.subtitle ?? null,
        description: parsed.description ?? null,
        excerpt: parsed.excerpt ?? null,
        status: parsed.status ?? 'draft',
        tags: parsed.tags ?? [],
        topics: parsed.topics ?? [],
        canonicalUrl: parsed.canonicalUrl ?? null,
        seoTitle: parsed.seoTitle ?? null,
        seoDescription: parsed.seoDescription ?? null,
        ogImageUrl: parsed.ogImageUrl ?? null,
        publishedAt: parsed.status === 'published' ? now() : null,
      };
      try {
        return mapWritingRecord(await repository.create(values));
      } catch (error) {
        return rethrowSlugConflict(error, values.slug);
      }
    },

    async updateWriting(
      id: string,
      input: UpdateWritingInput,
    ): Promise<Writing | null> {
      const parsed = updateWritingSchema.parse(input);
      const existing = await repository.getById(id);
      if (!existing) return null;

      const values: WritingRecordUpdate = { ...parsed };
      if (parsed.status === 'published' && !existing.publishedAt) {
        values.publishedAt = now();
      }

      try {
        const updated = await repository.update(id, values);
        return updated ? mapWritingRecord(updated) : null;
      } catch (error) {
        return rethrowSlugConflict(error, parsed.slug ?? existing.slug);
      }
    },

    async attachWritingPdf(
      id: string,
      file: File,
      { token }: WritingPdfOperationOptions,
    ): Promise<WritingServiceResult<Writing>> {
      const existingRow = await repository.getById(id);
      if (!existingRow) throw new WritingNotFoundError(id);
      await validateWritingPdf(file);

      const previousPdfPathname = existingRow.pdfPathname;
      const uploadedPdf = await pdfStorage.upload({ writingId: id, file, token });
      let updatedRow: WritingRecord | null;
      try {
        updatedRow = await repository.update(id, pdfRecordUpdate(uploadedPdf));
        if (!updatedRow) throw new WritingNotFoundError(id);
      } catch (cause) {
        const warnings: WritingServiceWarning[] = [];
        try {
          await pdfStorage.delete({ pathname: uploadedPdf.pathname, token });
        } catch (cleanupCause) {
          const warning: WritingServiceWarning = {
            code: 'new_pdf_cleanup_failed',
            message: 'Failed to clean up a newly uploaded PDF after the database update failed.',
            cause: cleanupCause,
          };
          warnings.push(warning);
          reportWarning(warning, id);
        }
        throw new WritingPdfAttachmentError(cause, warnings);
      }

      const warnings: WritingServiceWarning[] = [];
      if (
        previousPdfPathname &&
        previousPdfPathname !== uploadedPdf.pathname
      ) {
        try {
          await pdfStorage.delete({ pathname: previousPdfPathname, token });
        } catch (cause) {
          const warning: WritingServiceWarning = {
            code: 'old_pdf_cleanup_failed',
            message: 'The new PDF was saved, but the previous blob could not be deleted.',
            cause,
          };
          warnings.push(warning);
          reportWarning(warning, id);
        }
      }

      return { data: mapWritingRecord(updatedRow), warnings };
    },

    async removeWritingPdf(
      id: string,
      { token }: WritingPdfOperationOptions,
    ): Promise<WritingServiceResult<Writing | null>> {
      const existingRow = await repository.getById(id);
      if (!existingRow) return { data: null, warnings: [] };
      const previousPdfPathname = existingRow.pdfPathname;
      const updatedRow = await repository.update(id, pdfRecordUpdate(null));
      const warnings: WritingServiceWarning[] = [];

      if (previousPdfPathname) {
        try {
          await pdfStorage.delete({ pathname: previousPdfPathname, token });
        } catch (cause) {
          const warning: WritingServiceWarning = {
            code: 'removed_pdf_cleanup_failed',
            message: 'PDF metadata was removed, but its blob could not be deleted.',
            cause,
          };
          warnings.push(warning);
          reportWarning(warning, id);
        }
      }

      return {
        data: updatedRow ? mapWritingRecord(updatedRow) : null,
        warnings,
      };
    },

    async deleteWriting(
      id: string,
      { token }: WritingPdfOperationOptions,
    ): Promise<WritingServiceResult<Writing | null>> {
      const deletedRow = await repository.delete(id);
      if (!deletedRow) return { data: null, warnings: [] };
      const deleted = mapWritingRecord(deletedRow);
      const warnings: WritingServiceWarning[] = [];

      if (deletedRow.pdfPathname) {
        try {
          await pdfStorage.delete({ pathname: deletedRow.pdfPathname, token });
        } catch (cause) {
          const warning: WritingServiceWarning = {
            code: 'deleted_writing_pdf_cleanup_failed',
            message: 'The writing was deleted, but its PDF blob could not be deleted.',
            cause,
          };
          warnings.push(warning);
          reportWarning(warning, id);
        }
      }

      return { data: deleted, warnings };
    },
  };
}

let productionServicePromise: Promise<ReturnType<typeof createWritingService>> | null =
  null;

async function productionService() {
  productionServicePromise ??= import('../db/client').then(({ getDatabase }) =>
    createWritingService({
      repository: createDrizzleWritingRepository(getDatabase()),
    }),
  );
  return productionServicePromise;
}

export async function listPublishedWritings(): Promise<WritingSummary[]> {
  return (await productionService()).listPublishedWritings();
}

export async function listWritingsForAdmin(): Promise<Writing[]> {
  return (await productionService()).listWritingsForAdmin();
}

export async function getPublishedWritingBySlug(
  slug: string,
): Promise<Writing | null> {
  return (await productionService()).getPublishedWritingBySlug(slug);
}

export async function getWritingById(id: string): Promise<Writing | null> {
  return (await productionService()).getWritingById(id);
}

export async function createWriting(input: CreateWritingInput): Promise<Writing> {
  return (await productionService()).createWriting(input);
}

export async function updateWriting(
  id: string,
  input: UpdateWritingInput,
): Promise<Writing | null> {
  return (await productionService()).updateWriting(id, input);
}

export async function attachWritingPdf(
  id: string,
  file: File,
  options: WritingPdfOperationOptions,
): Promise<WritingServiceResult<Writing>> {
  return (await productionService()).attachWritingPdf(id, file, options);
}

export async function removeWritingPdf(
  id: string,
  options: WritingPdfOperationOptions,
): Promise<WritingServiceResult<Writing | null>> {
  return (await productionService()).removeWritingPdf(id, options);
}

export async function deleteWriting(
  id: string,
  options: WritingPdfOperationOptions,
): Promise<WritingServiceResult<Writing | null>> {
  return (await productionService()).deleteWriting(id, options);
}
