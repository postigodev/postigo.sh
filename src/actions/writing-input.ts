import { z } from 'zod';
import {
  WRITING_TYPES,
  type CreateWritingInput,
  type UpdateWritingInput,
  type WritingAuthor,
} from '../writings/domain';

const formListValueSchema = z.union([
  z.string(),
  z.array(z.string()),
  z.null(),
]);

const nullableFormTextSchema = z.union([z.string(), z.null()]);

const writingFormFields = {
  slug: z.union([z.string(), z.null()]).optional(),
  title: z.string(),
  subtitle: nullableFormTextSchema,
  description: nullableFormTextSchema,
  excerpt: nullableFormTextSchema,
  contentMarkdown: z.string(),
  type: z.enum(WRITING_TYPES),
  language: z.string(),
  authors: formListValueSchema,
  tags: formListValueSchema,
  topics: formListValueSchema,
  canonicalUrl: nullableFormTextSchema,
  seoTitle: nullableFormTextSchema,
  seoDescription: nullableFormTextSchema,
  ogImageUrl: nullableFormTextSchema,
};

export const createWritingActionInputSchema = z.object(writingFormFields);

export const updateWritingActionInputSchema = z.object({
  id: z.string(),
  ...writingFormFields,
});

export const writingIdActionInputSchema = z.object({ id: z.string() });

export const deleteWritingActionInputSchema = z.object({
  id: z.string(),
  expectedSlug: z.string(),
});

export const uploadWritingPdfActionInputSchema = z.object({
  id: z.string(),
  file: z.custom<File>(
    (value) => typeof File !== 'undefined' && value instanceof File,
    'A PDF File is required.',
  ),
});

export type CreateWritingActionInput = z.input<
  typeof createWritingActionInputSchema
>;
export type UpdateWritingActionInput = z.input<
  typeof updateWritingActionInputSchema
>;
export type WritingIdActionInput = z.input<typeof writingIdActionInputSchema>;
export type DeleteWritingActionInput = z.input<
  typeof deleteWritingActionInputSchema
>;
export type UploadWritingPdfActionInput = z.input<
  typeof uploadWritingPdfActionInputSchema
>;

type FormListValue = z.output<typeof formListValueSchema>;

const authorObjectSchema = z.object({
  name: z.string(),
  url: z.string().optional(),
});

function formEntries(value: FormListValue): string[] {
  if (value === null) return [];
  return (Array.isArray(value) ? value : [value]).flatMap((entry) =>
    entry.split(/\r?\n/),
  );
}

function invalidAuthors(message: string): never {
  throw new z.ZodError([
    {
      code: 'custom',
      path: ['authors'],
      message,
    },
  ]);
}

export function parseAuthors(value: FormListValue): WritingAuthor[] {
  const entries = formEntries(value)
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (entries.length === 1 && entries[0]?.startsWith('[')) {
    try {
      return z.array(authorObjectSchema).parse(JSON.parse(entries[0]));
    } catch {
      return invalidAuthors(
        'Authors JSON must be an array of objects with a name and optional URL.',
      );
    }
  }

  return entries.map((entry) => {
    if (entry.startsWith('{')) {
      try {
        return authorObjectSchema.parse(JSON.parse(entry));
      } catch {
        return invalidAuthors(
          'Each author JSON entry must contain a name and optional URL.',
        );
      }
    }

    const [name = '', ...urlParts] = entry.split('|');
    const url = urlParts.join('|').trim();
    return { name: name.trim(), ...(url ? { url } : {}) };
  });
}

export function parseStringList(value: FormListValue): string[] {
  return formEntries(value)
    .flatMap((entry) => entry.split(','))
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function parseNullableText(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const normalized = value.trim();
  return normalized || null;
}

function normalizeWritingFields(
  input: z.output<typeof createWritingActionInputSchema>,
): CreateWritingInput {
  const slug = parseNullableText(input.slug);
  return {
    ...(slug ? { slug } : {}),
    title: input.title,
    subtitle: parseNullableText(input.subtitle),
    description: parseNullableText(input.description),
    excerpt: parseNullableText(input.excerpt),
    contentMarkdown: input.contentMarkdown,
    type: input.type,
    language: input.language,
    authors: parseAuthors(input.authors),
    tags: parseStringList(input.tags),
    topics: parseStringList(input.topics),
    canonicalUrl: parseNullableText(input.canonicalUrl),
    seoTitle: parseNullableText(input.seoTitle),
    seoDescription: parseNullableText(input.seoDescription),
    ogImageUrl: parseNullableText(input.ogImageUrl),
  };
}

export function parseCreateWritingActionInput(
  input: unknown,
): CreateWritingInput {
  return normalizeWritingFields(createWritingActionInputSchema.parse(input));
}

export function parseUpdateWritingActionInput(input: unknown): {
  id: string;
  values: UpdateWritingInput;
} {
  const parsed = updateWritingActionInputSchema.parse(input);
  const { id, ...fields } = parsed;
  return { id, values: normalizeWritingFields(fields) };
}
