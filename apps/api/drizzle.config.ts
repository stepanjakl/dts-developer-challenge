import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

const localEnvironmentFile = "../../.env.local";

if (existsSync(localEnvironmentFile)) {
  process.loadEnvFile(localEnvironmentFile);
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED ?? "",
  },
});
