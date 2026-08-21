import type { WritingSummary as DomainWritingSummary } from '../writings/domain';

export interface WritingSummary {
  slug: string;
  title: string;
  summary: string;
  publishedAt: string;
}

export function projectWritingSummary(
  writing: DomainWritingSummary,
): WritingSummary {
  return {
    slug: writing.slug,
    title: writing.title,
    summary: writing.summary,
    publishedAt: writing.publishedAt.toISOString(),
  };
}

export function getPublishedWritings(): readonly WritingSummary[] {
  return [];
}
