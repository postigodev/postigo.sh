import { describe, expect, it } from 'vitest';
import {
  createWritingSchema,
  MAX_PDF_BYTES,
  normalizeWritingSlug,
  updateWritingSchema,
  validateWritingPdf,
  writingLanguageSchema,
} from './schemas';

const validInput = {
  title: 'A useful title',
  contentMarkdown: '# Content',
  type: 'article' as const,
  language: 'en-us',
  authors: [{ name: 'Piero' }],
};

describe('writing schemas', () => {
  it('normalizes slugs with NFKD, lowercase, and collapsed separators', () => {
    expect(normalizeWritingSlug('  Déjà_Vu / A  Test!  ')).toBe(
      'deja-vu-a-test',
    );
    expect(createWritingSchema.parse(validInput)).toMatchObject({
      slug: 'a-useful-title',
      language: 'en-US',
    });
  });

  it('canonicalizes BCP 47 language tags with Intl', () => {
    expect(writingLanguageSchema.parse('zh-hant-tw')).toBe('zh-Hant-TW');
    expect(() => writingLanguageSchema.parse('en_US')).toThrow(
      'Invalid language tag',
    );
  });

  it('rejects empty required content, authors, invalid enums, and empty updates', () => {
    expect(() =>
      createWritingSchema.parse({
        ...validInput,
        title: ' ',
        contentMarkdown: ' ',
        authors: [],
        type: 'book',
      }),
    ).toThrow();
    expect(() => updateWritingSchema.parse({})).toThrow(
      'At least one field must be updated',
    );
  });

  it('trims bounded arrays and removes exact duplicates', () => {
    expect(
      createWritingSchema.parse({
        ...validInput,
        tags: [' astro ', 'astro', 'web'],
      }).tags,
    ).toEqual(['astro', 'web']);
  });
});

describe('writing PDF validation', () => {
  it('accepts a PDF at the exact maximum byte size', async () => {
    const bytes = new Uint8Array(MAX_PDF_BYTES);
    bytes.set([0x25, 0x50, 0x44, 0x46, 0x2d]);
    const file = new File([bytes], 'paper.PDF', { type: 'application/pdf' });

    await expect(validateWritingPdf(file)).resolves.toBe(file);
  });

  it('rejects the wrong MIME, extension, size, and signature with useful errors', async () => {
    const bad = new File(['not a pdf'], 'paper.txt', { type: 'text/plain' });
    await expect(validateWritingPdf(bad)).rejects.toThrow('PDF MIME type');

    const oversized = new File(
      ['%PDF-', new Uint8Array(MAX_PDF_BYTES - 4)],
      'paper.pdf',
      { type: 'application/pdf' },
    );
    await expect(validateWritingPdf(oversized)).rejects.toThrow(
      `${MAX_PDF_BYTES} bytes`,
    );

    const spoofed = new File(['hello'], 'paper.pdf', {
      type: 'application/pdf',
    });
    await expect(validateWritingPdf(spoofed)).rejects.toThrow('%PDF- signature');
  });
});
