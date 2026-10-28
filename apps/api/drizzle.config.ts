/*
 * drizzle.config.ts
 * Role: Migration configuration
 *
 * Loads the direct Postgres connection used by Drizzle's database commands.
 */

import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";
import { z } from "zod";

const localEnvironmentFile = "../../.env.local";

if (existsSync(localEnvironmentFile)) {
  process.loadEnvFile(localEnvironmentFile);
}

const databaseUrl = z
  .url({ protocol: /^postgres(ql)?$/ })
  .safeParse(process.env.DATABASE_URL_UNPOOLED);
if (!databaseUrl.success) {
  throw new Error(
    "DATABASE_URL_UNPOOLED must be set to a postgres:// or postgresql:// connection URL for Drizzle commands",
  );
}

export default defineConfig({
  dialect: "postgresql",
  // Tables live in each feature folder
  schema: "./src/features/*/*.table.ts",
  out: "./src/db/migrations",
  dbCredentials: {
    url: databaseUrl.data,
  },
});
