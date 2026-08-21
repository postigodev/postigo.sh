import { z } from 'zod';
import {
  WRITING_STATUSES,
  WRITING_TYPES,
  type CreateWritingInput,
  type UpdateWritingInput,
  type WritingAuthor,
} from './domain';

export const MAX_PDF_BYTES = 4_000_000;
export const WRITING_LIMITS = {
  slug: 120,
  title: 200,
  subtitle: 300,
  description: 1_000,
  excerpt: 1_000,
  contentMarkdown: 250_000,
  authors: 20,
  authorName: 120,
  tags: 30,
  topics: 30,
  listItem: 80,
  url: 2_048,
  seoTitle: 200,
  seoDescription: 500,
} as const;

export function normalizeWritingSlug(value: string): string {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/\p{Mark}+/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function trimmedText(max: number) {
  return z.string().trim().min(1).max(max);
}

function nullableText(max: number) {
  return z.union([trimmedText(max), z.null()]);
}

function nullableUrl() {
  return z.union([z.url().max(WRITING_LIMITS.url), z.null()]);
}

export const writingSlugSchema = z
  .string()
  .trim()
  .min(1, 'Slug cannot be empty.')
  .transform(normalizeWritingSlug)
  .pipe(
    z
      .string()
      .min(1, 'Slug must contain at least one letter or number.')
      .max(WRITING_LIMITS.slug, 'Slug is too long.'),
  );

export const writingLanguageSchema = z
  .string()
  .trim()
  .min(1, 'Language cannot be empty.')
  .transform((value, context) => {
    try {
      const [canonical] = Intl.getCanonicalLocales(value);
      if (!canonical) {
        throw new RangeError('No canonical locale was returned.');
      }
      return canonical;
    } catch {
      context.addIssue({
        code: 'custom',
        message: `Invalid language tag: ${value}`,
      });
      return z.NEVER;
    }
  });

export const writingAuthorSchema = z.object({
  name: trimmedText(WRITING_LIMITS.authorName),
  url: z.url().max(WRITING_LIMITS.url).optional(),
}) satisfies z.ZodType<WritingAuthor>;

const stringListSchema = (max: number) =>
  z
    .array(trimmedText(WRITING_LIMITS.listItem))
    .max(max)
    .transform((values) => [...new Set(values)]);

const writingFields = {
  slug: writingSlugSchema.optional(),
  title: trimmedText(WRITING_LIMITS.title),
  subtitle: nullableText(WRITING_LIMITS.subtitle).optional(),
  description: nullableText(WRITING_LIMITS.description).optional(),
  excerpt: nullableText(WRITING_LIMITS.excerpt).optional(),
  contentMarkdown: trimmedText(WRITING_LIMITS.contentMarkdown),
  type: z.enum(WRITING_TYPES),
  language: writingLanguageSchema,
  authors: z
    .array(writingAuthorSchema)
    .min(1, 'At least one author is required.')
    .max(WRITING_LIMITS.authors),
  tags: stringListSchema(WRITING_LIMITS.tags).optional(),
  topics: stringListSchema(WRITING_LIMITS.topics).optional(),
  canonicalUrl: nullableUrl().optional(),
  seoTitle: nullableText(WRITING_LIMITS.seoTitle).optional(),
  seoDescription: nullableText(WRITING_LIMITS.seoDescription).optional(),
  ogImageUrl: nullableUrl().optional(),
};

const createWritingFields = {
  ...writingFields,
  status: z.enum(WRITING_STATUSES).optional(),
};

export const createWritingSchema = z
  .object(createWritingFields)
  .transform((input) => ({
    ...input,
    slug: input.slug ?? normalizeWritingSlug(input.title),
  }))
  .pipe(
    z.object({
      ...createWritingFields,
      slug: writingSlugSchema,
    }),
  ) satisfies z.ZodType<CreateWritingInput & { slug: string }>;

export const updateWritingSchema = z
  .object(writingFields)
  .partial()
  .refine((input) => Object.keys(input).length > 0, {
    message: 'At least one field must be updated.',
  }) satisfies z.ZodType<UpdateWritingInput>;

const pdfFileSchema = z.custom<File>(
  (value) => typeof File !== 'undefined' && value instanceof File,
  'A PDF File is required.',
);

export const writingPdfSchema = pdfFileSchema.superRefine(async (file, context) => {
  if (file.type !== 'application/pdf') {
    context.addIssue({
      code: 'custom',
      message: 'PDF MIME type must be application/pdf.',
    });
  }

  if (!file.name.toLowerCase().endsWith('.pdf')) {
    context.addIssue({
      code: 'custom',
      message: 'PDF filename must end in .pdf.',
    });
  }

  if (file.size > MAX_PDF_BYTES) {
    context.addIssue({
      code: 'custom',
      message: `PDF must not exceed ${MAX_PDF_BYTES} bytes.`,
    });
  }

  if (file.size < 5) {
    context.addIssue({
      code: 'custom',
      message: 'PDF file is too short to contain a valid %PDF- signature.',
    });
    return;
  }

  const signature = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  const expected = [0x25, 0x50, 0x44, 0x46, 0x2d];
  if (!expected.every((byte, index) => signature[index] === byte)) {
    context.addIssue({
      code: 'custom',
      message: 'PDF content must begin with the %PDF- signature.',
    });
  }
});

export async function validateWritingPdf(file: File): Promise<File> {
  return writingPdfSchema.parseAsync(file);
}
