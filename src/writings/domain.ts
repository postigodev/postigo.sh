export const WRITING_TYPES = ['essay', 'paper', 'article', 'note'] as const;
export const WRITING_STATUSES = ['draft', 'published'] as const;

export type WritingType = (typeof WRITING_TYPES)[number];
export type WritingStatus = (typeof WRITING_STATUSES)[number];

export interface WritingAuthor {
  name: string;
  url?: string;
}

export interface WritingPdfMetadata {
  url: string;
  pathname: string;
  filename: string;
  size: number;
  mimeType: 'application/pdf';
}

export interface Writing {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  excerpt: string | null;
  contentMarkdown: string;
  type: WritingType;
  language: string;
  status: WritingStatus;
  authors: WritingAuthor[];
  tags: string[];
  topics: string[];
  canonicalUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImageUrl: string | null;
  pdf: WritingPdfMetadata | null;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
}

export interface WritingSummary {
  id: string;
  slug: string;
  title: string;
  summary: string;
  type: WritingType;
  language: string;
  authors: WritingAuthor[];
  tags: string[];
  topics: string[];
  publishedAt: Date;
}

export interface CreateWritingInput {
  slug?: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  excerpt?: string | null;
  contentMarkdown: string;
  type: WritingType;
  language: string;
  status?: WritingStatus;
  authors: WritingAuthor[];
  tags?: string[];
  topics?: string[];
  canonicalUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogImageUrl?: string | null;
}

export type UpdateWritingInput = Partial<CreateWritingInput>;

export type WritingServiceWarningCode =
  | 'old_pdf_cleanup_failed'
  | 'new_pdf_cleanup_failed'
  | 'removed_pdf_cleanup_failed'
  | 'deleted_writing_pdf_cleanup_failed';

export interface WritingServiceWarning {
  code: WritingServiceWarningCode;
  message: string;
  cause?: unknown;
}

export interface WritingServiceResult<T> {
  data: T;
  warnings: WritingServiceWarning[];
}
