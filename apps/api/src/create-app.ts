import express, { type Express } from "express";
import helmet from "helmet";
import type { Database } from "./db/client.ts";
import { createDocsRouter } from "./docs/docs.routes.ts";
import { errorHandler, notFoundHandler } from "./http/error-handler.ts";
import { TasksRepository } from "./tasks/tasks.repository.ts";
import { createTasksRouter } from "./tasks/tasks.routes.ts";
import { TasksService } from "./tasks/tasks.service.ts";

export function createApp(database: Database): Express {
  const tasksService = new TasksService(new TasksRepository(database));

  const app = express();
  app.use(helmet());
  app.use(express.json({ limit: "10kb" }));

  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok" });
  });
  app.use("/api/tasks", createTasksRouter(tasksService));
  app.use("/api", createDocsRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
