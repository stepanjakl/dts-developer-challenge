import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import type { Database } from "../db/client.ts";

const migrationsFolder = fileURLToPath(new URL("../db/migrations", import.meta.url));

export async function createTestDatabase(): Promise<Database> {
  const database = drizzle({ client: new PGlite() });
  await migrate(database, { migrationsFolder });
  return database;
}
