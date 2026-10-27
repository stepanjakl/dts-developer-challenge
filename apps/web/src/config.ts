import { z } from "zod";

const environmentSchema = z.object({
  TASKS_API_URL: z.url().default("http://localhost:3001"),
  PORT: z.coerce.number().int().default(3000),
});

export type Config = {
  tasksApiUrl: string;
  port: number;
};

export function loadConfig(environment: NodeJS.ProcessEnv): Config {
  const result = environmentSchema.safeParse(environment);
  if (!result.success) {
    throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`);
  }
  return {
    tasksApiUrl: result.data.TASKS_API_URL,
    port: result.data.PORT,
  };
}
