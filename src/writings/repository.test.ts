import { drizzle } from 'drizzle-orm/neon-http';
import { describe, expect, it } from 'vitest';
import type { Database } from '../db/client';
import * as schema from '../db/schema';
import { createDrizzleWritingRepository } from './repository';

interface CapturedQuery {
  sql: string;
  params: unknown[];
}

function repositoryWithCapturedQueries() {
  const queries: CapturedQuery[] = [];
  const client = async (sql: string, params: unknown[]) => {
    queries.push({ sql, params });
    return { rows: [] };
  };
  const database = drizzle(client as never, { schema }) as Database;
  return {
    queries,
    repository: createDrizzleWritingRepository(database),
  };
}

describe('Drizzle writing publication operations', () => {
  it('publishes with one database update that preserves the first timestamp', async () => {
    const { queries, repository } = repositoryWithCapturedQueries();
    const id = '00000000-0000-4000-8000-000000000001';
    const publishedAt = new Date('2026-08-20T12:00:00.000Z');

    await repository.publish(id, publishedAt);

    expect(queries).toHaveLength(1);
    const query = queries[0] as CapturedQuery;
    const updateClause = query.sql.slice(0, query.sql.indexOf(' where '));
    expect(updateClause).toContain('"status" = $1');
    const publishedAtParameter = updateClause.match(
      /"published_at" = coalesce\("writings"\."published_at", \$(\d+)\)/,
    );
    expect(publishedAtParameter).not.toBeNull();
    expect(query.params[0]).toBe('published');
    expect(query.params[Number(publishedAtParameter?.[1]) - 1]).toBe(
      publishedAt,
    );
    expect(query.params.at(-1)).toBe(id);
  });

  it('unpublishes without clearing the first publication timestamp', async () => {
    const { queries, repository } = repositoryWithCapturedQueries();
    const id = '00000000-0000-4000-8000-000000000001';

    await repository.unpublish(id);

    expect(queries).toHaveLength(1);
    const query = queries[0] as CapturedQuery;
    const updateClause = query.sql.slice(0, query.sql.indexOf(' where '));
    expect(updateClause).toContain('"status" = $1');
    expect(updateClause).not.toContain('"published_at" =');
    expect(query.params[0]).toBe('draft');
    expect(query.params.at(-1)).toBe(id);
  });
});
