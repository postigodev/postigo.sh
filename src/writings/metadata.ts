import type { Writing } from './domain';

export interface WritingMetadataOptions {
  siteUrl: string | URL;
}

export interface WritingMetadata {
  title: string;
  description: string;
  canonicalUrl: string;
  openGraph: {
    type: 'article';
    title: string;
    description: string;
    url: string;
    image?: string;
    locale: string;
    publishedTime?: string;
    modifiedTime: string;
  };
  jsonLd: {
    '@context': 'https://schema.org';
    '@type': 'Article' | 'ScholarlyArticle';
    headline: string;
    description: string;
    inLanguage: string;
    mainEntityOfPage: string;
    author: Array<{ '@type': 'Person'; name: string; url?: string }>;
    dateModified: string;
    datePublished?: string;
    keywords?: string[];
    encoding?: {
      '@type': 'MediaObject';
      contentUrl: string;
      encodingFormat: 'application/pdf';
    };
  };
}

function absoluteUrl(pathname: string, siteUrl: string | URL): string {
  return new URL(pathname, siteUrl).toString();
}

export function buildWritingMetadata(
  writing: Writing,
  { siteUrl }: WritingMetadataOptions,
): WritingMetadata {
  const routePath = `/writings/${encodeURIComponent(writing.slug)}`;
  const canonicalUrl = writing.canonicalUrl ?? absoluteUrl(routePath, siteUrl);
  const title = writing.seoTitle ?? writing.title;
  const description =
    writing.seoDescription ??
    writing.description ??
    writing.excerpt ??
    writing.subtitle ??
    writing.title;
  const datePublished = writing.publishedAt?.toISOString();
  const stablePdfUrl = writing.pdf
    ? absoluteUrl(`${routePath}/paper.pdf`, siteUrl)
    : undefined;

  return {
    title,
    description,
    canonicalUrl,
    openGraph: {
      type: 'article',
      title,
      description,
      url: canonicalUrl,
      ...(writing.ogImageUrl ? { image: writing.ogImageUrl } : {}),
      locale: writing.language,
      ...(datePublished ? { publishedTime: datePublished } : {}),
      modifiedTime: writing.updatedAt.toISOString(),
    },
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': writing.type === 'paper' ? 'ScholarlyArticle' : 'Article',
      headline: writing.title,
      description,
      inLanguage: writing.language,
      mainEntityOfPage: canonicalUrl,
      author: writing.authors.map((author) => ({
        '@type': 'Person',
        name: author.name,
        ...(author.url ? { url: author.url } : {}),
      })),
      dateModified: writing.updatedAt.toISOString(),
      ...(datePublished ? { datePublished } : {}),
      ...(writing.tags.length + writing.topics.length > 0
        ? { keywords: [...writing.tags, ...writing.topics] }
        : {}),
      ...(stablePdfUrl
        ? {
            encoding: {
              '@type': 'MediaObject',
              contentUrl: stablePdfUrl,
              encodingFormat: 'application/pdf',
            } as const,
          }
        : {}),
    },
  };
}
