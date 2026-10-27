import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

export type Database = PgDatabase<PgQueryResultHKT>;

export function createDatabase(databaseUrl: string): Database {
  return drizzle({ client: neon(databaseUrl) });
}
