import { getTableName, is } from 'drizzle-orm';
import { getTableConfig, IndexedColumn } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';
import {
  account,
  portfolioLocation,
  session,
  user,
  verification,
  writings,
} from './schema';

describe('auth schema', () => {
  it('keeps Better Auth models singular and issuer-scoped', () => {
    expect([user, session, account, verification].map(getTableName)).toEqual([
      'user',
      'session',
      'account',
      'verification',
    ]);

    const accountIndexes = getTableConfig(account).indexes;
    const issuerIndex = accountIndexes.find(
      (dbIndex) => dbIndex.config.name === 'account_issuer_account_id_uidx',
    );
    const issuerColumns = issuerIndex?.config.columns.filter((column) =>
      is(column, IndexedColumn),
    );

    expect(issuerIndex?.config.unique).toBe(true);
    expect(issuerColumns?.map((column) => column.name)).toEqual([
      'issuer',
      'account_id',
    ]);
  });
});

describe('writings schema', () => {
  it('keeps one slug constraint and the public listing index', () => {
    const config = getTableConfig(writings);

    expect(writings.slug.isUnique).toBe(true);
    expect(config.indexes.map((dbIndex) => dbIndex.config.name)).toEqual([
      'writings_public_idx',
    ]);

    const publicIndex = config.indexes[0];
    const publicColumns = publicIndex?.config.columns.filter((column) =>
      is(column, IndexedColumn),
    );

    expect(publicColumns?.map((column) => column.name)).toEqual([
      'status',
      'published_at',
      'id',
    ]);
    expect(publicColumns?.[1]?.indexConfig.order).toBe('desc');
  });

  it('uses non-null typed collection columns and a nullable publication date', () => {
    expect(writings.authors.notNull).toBe(true);
    expect(writings.tags.notNull).toBe(true);
    expect(writings.topics.notNull).toBe(true);
    expect(writings.publishedAt.notNull).toBe(false);
  });

  it('uses only the approved Open Graph image and PDF metadata fields', () => {
    const propertyNames = Object.keys(writings);
    const columnNames = getTableConfig(writings).columns.map(
      (column) => column.name,
    );

    expect(propertyNames).toEqual(
      expect.arrayContaining([
        'ogImageUrl',
        'pdfUrl',
        'pdfPathname',
        'pdfFilename',
        'pdfSize',
        'pdfMimeType',
      ]),
    );
    for (const forbiddenPropertyName of [
      'openGraphTitle',
      'openGraphDescription',
      'openGraphImageUrl',
      'pdfFileName',
      'pdfSizeBytes',
    ]) {
      expect(propertyNames).not.toContain(forbiddenPropertyName);
    }
    expect(columnNames).toEqual(
      expect.arrayContaining([
        'og_image_url',
        'pdf_url',
        'pdf_pathname',
        'pdf_filename',
        'pdf_size',
        'pdf_mime_type',
      ]),
    );
    for (const forbiddenColumnName of [
      'open_graph_title',
      'open_graph_description',
      'open_graph_image_url',
      'pdf_file_name',
      'pdf_size_bytes',
    ]) {
      expect(columnNames).not.toContain(forbiddenColumnName);
    }
  });
});

describe('portfolio location schema', () => {
  it('stores one coarse current location without IP or history fields', () => {
    expect(getTableName(portfolioLocation)).toBe('portfolio_location');
    expect(
      getTableConfig(portfolioLocation).columns.map((column) => column.name),
    ).toEqual([
      'id',
      'city',
      'region',
      'country',
      'timezone',
      'latitude',
      'longitude',
      'weather_symbol_code',
      'weather_temperature_c',
      'weather_observed_at',
      'weather_fetched_at',
      'weather_expires_at',
      'weather_last_modified',
      'updated_at',
    ]);
    expect(portfolioLocation.id.primary).toBe(true);
    expect(portfolioLocation.region.notNull).toBe(false);
  });
});
