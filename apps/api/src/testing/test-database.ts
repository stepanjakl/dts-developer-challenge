/*
 * test-database.ts
 * Role: Test support
 *
 * Applies real migrations to an owned in-memory database and exposes cleanup.
 */

import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import type { Database } from "../db/client.ts";

const migrationsFolder = fileURLToPath(new URL("../db/migrations", import.meta.url));

export type TestDatabase = {
  database: Database;
  close: () => Promise<void>;
};

export async function createTestDatabase(): Promise<TestDatabase> {
  const client = new PGlite();
  try {
    const database = drizzle({ client });
    await migrate(database, { migrationsFolder });
    return { database, close: () => client.close() };
  } catch (error) {
    await client.close();
    throw error;
  }
}
