export interface WritingSummary {
  slug: string;
  title: string;
  summary: string;
  publishedAt: string;
}

export function getPublishedWritings(): readonly WritingSummary[] {
  return [];
}
