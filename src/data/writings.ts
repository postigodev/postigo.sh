import type { WritingSummary as DomainWritingSummary } from '../writings/domain';
import { listPublishedWritings } from '../writings/service';

export interface WritingSummary {
  slug: string;
  title: string;
  summary: string;
  publishedAt: string;
}

export interface PublishedWritingsLoad {
  writings: readonly WritingSummary[];
  available: boolean;
}

export interface PublishedWritingsDependencies {
  listPublished(): Promise<DomainWritingSummary[]>;
  logger: Pick<Console, 'error'>;
}

export class PublishedWritingsUnavailableError extends Error {
  constructor(options?: ErrorOptions) {
    super('Published writings are temporarily unavailable.', options);
    this.name = 'PublishedWritingsUnavailableError';
  }
}

const productionDependencies: PublishedWritingsDependencies = {
  listPublished: listPublishedWritings,
  logger: console,
};

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

export async function getPublishedWritings(
  dependencies: PublishedWritingsDependencies = productionDependencies,
): Promise<readonly WritingSummary[]> {
  try {
    return (await dependencies.listPublished()).map(projectWritingSummary);
  } catch (cause) {
    dependencies.logger.error('Unable to load published writings.', { cause });
    throw new PublishedWritingsUnavailableError({ cause });
  }
}

export async function getPublishedWritingsOrFallback(
  dependencies: PublishedWritingsDependencies = productionDependencies,
): Promise<PublishedWritingsLoad> {
  try {
    return {
      writings: await getPublishedWritings(dependencies),
      available: true,
    };
  } catch (error) {
    if (!(error instanceof PublishedWritingsUnavailableError)) throw error;
    return { writings: [], available: false };
  }
}
