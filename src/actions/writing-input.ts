import { z } from 'zod';
import {
  WRITING_TYPES,
  type CreateWritingInput,
  type UpdateWritingInput,
  type WritingAuthor,
} from '../writings/domain';

const nullableFormTextSchema = z.union([z.string(), z.null()]);
const repeatedTextSchema = z.array(z.string());

export const writingIdSchema = z
  .string({ error: 'Writing ID is required.' })
  .trim()
  .pipe(z.uuid({ error: 'Writing ID must be a valid UUID.' }));

const writingFormFields = {
  slug: nullableFormTextSchema.optional(),
  title: z.string(),
  subtitle: nullableFormTextSchema,
  description: nullableFormTextSchema,
  excerpt: nullableFormTextSchema,
  contentMarkdown: z.string(),
  type: z.enum(WRITING_TYPES),
  language: z.string(),
  authors: repeatedTextSchema,
  tags: repeatedTextSchema,
  topics: repeatedTextSchema,
  canonicalUrl: nullableFormTextSchema,
  seoTitle: nullableFormTextSchema,
  seoDescription: nullableFormTextSchema,
  ogImageUrl: nullableFormTextSchema,
};

const createWritingFormSchema = z.object(writingFormFields);
const updateWritingFormSchema = z.object({
  id: writingIdSchema,
  ...writingFormFields,
});
const writingIdFormSchema = z.object({ id: writingIdSchema });
const deleteWritingFormSchema = z.object({
  id: writingIdSchema,
  expectedSlug: z.string().trim().min(1, 'Slug confirmation is required.'),
});
const uploadWritingPdfFormSchema = z.object({
  id: writingIdSchema,
  file: z.custom<File>(
    (value) => typeof File !== 'undefined' && value instanceof File,
    'A PDF File is required.',
  ),
});

const authorObjectSchema = z.object({
  name: z.string(),
  url: z.string().optional(),
});

function scalar(form: FormData, name: string): FormDataEntryValue | null {
  return form.get(name);
}

function repeated(form: FormData, name: string): FormDataEntryValue[] {
  return form.getAll(name);
}

function writingFieldsFromForm(form: FormData) {
  return {
    slug: scalar(form, 'slug'),
    title: scalar(form, 'title'),
    subtitle: scalar(form, 'subtitle'),
    description: scalar(form, 'description'),
    excerpt: scalar(form, 'excerpt'),
    contentMarkdown: scalar(form, 'contentMarkdown'),
    type: scalar(form, 'type'),
    language: scalar(form, 'language'),
    authors: repeated(form, 'authors'),
    tags: repeated(form, 'tags'),
    topics: repeated(form, 'topics'),
    canonicalUrl: scalar(form, 'canonicalUrl'),
    seoTitle: scalar(form, 'seoTitle'),
    seoDescription: scalar(form, 'seoDescription'),
    ogImageUrl: scalar(form, 'ogImageUrl'),
  };
}

function formEntries(value: string[]): string[] {
  return value.flatMap((entry) => entry.split(/\r?\n/));
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

export function parseAuthors(value: string[]): WritingAuthor[] {
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

export function parseStringList(value: string[]): string[] {
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
  input: z.output<typeof createWritingFormSchema>,
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
  form: FormData,
): CreateWritingInput {
  return normalizeWritingFields(
    createWritingFormSchema.parse(writingFieldsFromForm(form)),
  );
}

export function parseUpdateWritingActionInput(form: FormData): {
  id: string;
  values: UpdateWritingInput;
} {
  const parsed = updateWritingFormSchema.parse({
    id: scalar(form, 'id'),
    ...writingFieldsFromForm(form),
  });
  const { id, ...fields } = parsed;
  return { id, values: normalizeWritingFields(fields) };
}

export function parseWritingIdActionInput(form: FormData): { id: string } {
  return writingIdFormSchema.parse({ id: scalar(form, 'id') });
}

export function parseDeleteWritingActionInput(form: FormData): {
  id: string;
  expectedSlug: string;
} {
  return deleteWritingFormSchema.parse({
    id: scalar(form, 'id'),
    expectedSlug: scalar(form, 'expectedSlug'),
  });
}

export function parseUploadWritingPdfActionInput(form: FormData): {
  id: string;
  file: File;
} {
  return uploadWritingPdfFormSchema.parse({
    id: scalar(form, 'id'),
    file: scalar(form, 'file'),
  });
}
