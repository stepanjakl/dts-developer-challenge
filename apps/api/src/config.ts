/*
 * config.ts
 * Role: Configuration
 *
 * Validates the database connection URL and local listening port at startup.
 */

import { z } from "zod";

const environmentSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  PORT: z.coerce.number().int().min(0).max(65535).default(3001),
});

export type Config = {
  databaseUrl: string;
  port: number;
};

export function loadConfig(environment: NodeJS.ProcessEnv): Config {
  const result = environmentSchema.safeParse(environment);
  if (!result.success) {
    throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`);
  }
  return {
    databaseUrl: result.data.DATABASE_URL,
    port: result.data.PORT,
  };
}
