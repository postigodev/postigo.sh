import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { getDatabaseConfig } from '../lib/server-env';
import * as schema from './schema';

function createDatabase(databaseUrl: string) {
  return drizzle(neon(databaseUrl), { schema });
}

export type Database = ReturnType<typeof createDatabase>;

let database: Database | undefined;

export async function getDatabase(): Promise<Database> {
  if (database) {
    return database;
  }

  const { DATABASE_URL } = await getDatabaseConfig();
  database = createDatabase(DATABASE_URL);
  return database;
}
