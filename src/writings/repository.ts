import { and, asc, desc, eq, sql } from 'drizzle-orm';
import type { Database } from '../db/client';
import { writings } from '../db/schema';

export type WritingRecord = typeof writings.$inferSelect;
export type NewWritingRecord = typeof writings.$inferInsert;
export type WritingRecordUpdate = Partial<
  Omit<NewWritingRecord, 'id' | 'createdAt' | 'status' | 'publishedAt'>
>;

export interface WritingRepository {
  listPublished(): Promise<WritingRecord[]>;
  listForAdmin(): Promise<WritingRecord[]>;
  getPublishedBySlug(slug: string): Promise<WritingRecord | null>;
  getById(id: string): Promise<WritingRecord | null>;
  create(values: NewWritingRecord): Promise<WritingRecord>;
  update(id: string, values: WritingRecordUpdate): Promise<WritingRecord | null>;
  publish(id: string, publishedAt: Date): Promise<WritingRecord | null>;
  unpublish(id: string): Promise<WritingRecord | null>;
  delete(id: string): Promise<WritingRecord | null>;
}

function firstOrNull<T>(rows: T[]): T | null {
  return rows[0] ?? null;
}

export function createDrizzleWritingRepository(
  database: Database,
): WritingRepository {
  return {
    async listPublished() {
      return database
        .select()
        .from(writings)
        .where(eq(writings.status, 'published'))
        .orderBy(desc(writings.publishedAt), asc(writings.id));
    },

    async listForAdmin() {
      return database
        .select()
        .from(writings)
        .orderBy(desc(writings.updatedAt), asc(writings.id));
    },

    async getPublishedBySlug(slug) {
      return firstOrNull(
        await database
          .select()
          .from(writings)
          .where(
            and(eq(writings.slug, slug), eq(writings.status, 'published')),
          )
          .limit(1),
      );
    },

    async getById(id) {
      return firstOrNull(
        await database
          .select()
          .from(writings)
          .where(eq(writings.id, id))
          .limit(1),
      );
    },

    async create(values) {
      const row = firstOrNull(
        await database.insert(writings).values(values).returning(),
      );
      if (!row) {
        throw new Error('Writing insert returned no row.');
      }
      return row;
    },

    async update(id, values) {
      return firstOrNull(
        await database
          .update(writings)
          .set(values)
          .where(eq(writings.id, id))
          .returning(),
      );
    },

    async publish(id, publishedAt) {
      return firstOrNull(
        await database
          .update(writings)
          .set({
            status: 'published',
            publishedAt: sql<Date>`coalesce(${writings.publishedAt}, ${publishedAt})`,
          })
          .where(eq(writings.id, id))
          .returning(),
      );
    },

    async unpublish(id) {
      return firstOrNull(
        await database
          .update(writings)
          .set({ status: 'draft' })
          .where(eq(writings.id, id))
          .returning(),
      );
    },

    async delete(id) {
      return firstOrNull(
        await database
          .delete(writings)
          .where(eq(writings.id, id))
          .returning(),
      );
    },
  };
}
