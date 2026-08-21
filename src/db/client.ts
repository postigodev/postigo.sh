import { neon } from '@neondatabase/serverless';
import { DATABASE_URL } from 'astro:env/server';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

function createDatabase(databaseUrl: string) {
  return drizzle(neon(databaseUrl), { schema });
}

export type Database = ReturnType<typeof createDatabase>;

let database: Database | undefined;

export function getDatabase(): Database {
  if (database) {
    return database;
  }

  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is required to access the database.');
  }

  database = createDatabase(DATABASE_URL);
  return database;
}
