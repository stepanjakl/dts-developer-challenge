import { fileURLToPath } from "node:url";
import express, { type Express } from "express";
import helmet from "helmet";
import { errorHandler, notFoundHandler } from "./error-pages.ts";
import { contentSecurityPolicy } from "./security/content-security-policy.ts";
import { sameOriginOnly } from "./security/same-origin-only.ts";
import { createTasksRouter } from "./tasks/tasks.routes.ts";
import type { TasksClient } from "./tasks/tasks-client.ts";
import { configureViews } from "./views.ts";

const publicFolder = fileURLToPath(new URL("../public", import.meta.url));

export function createApp(tasksClient: TasksClient): Express {
  const app = express();
  app.set("trust proxy", true);
  configureViews(app);

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(contentSecurityPolicy);
  app.use(express.static(publicFolder));
  app.use(express.urlencoded({ extended: false, limit: "10kb" }));
  app.use(sameOriginOnly);

  app.use(createTasksRouter(tasksClient));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
