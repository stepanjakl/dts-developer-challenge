/*
 * app.ts
 * Role: Application assembly
 *
 * Connects task dependencies and assembles API middleware and routes.
 * Read this file to follow a request through the app.
 */

import express, { type Express } from "express";
import helmet from "helmet";
import type { Database } from "./db/client.ts";
import { errorHandler, notFoundHandler } from "./errors/error-responses.ts";
import { createDocsRouter } from "./features/docs/docs.routes.ts";
import { TasksRepository } from "./features/tasks/tasks.repository.ts";
import { createTasksRouter } from "./features/tasks/tasks.routes.ts";
import { TasksService } from "./features/tasks/tasks.service.ts";

export function createApp(database: Database): Express {
  const tasksRepository = new TasksRepository(database);
  const tasksService = new TasksService(tasksRepository);

  const app = express();
  app.use(helmet());
  app.use(express.json({ limit: "10kb" }));

  app.get("/api/health", function checkHealth(_request, response) {
    response.json({ status: "ok" });
  });
  app.use(createTasksRouter(tasksService));
  app.use(createDocsRouter(app));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
