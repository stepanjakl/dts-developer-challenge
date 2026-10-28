/*
 * app.ts
 * Role: Application assembly
 *
 * Configures templates and assembles middleware, local API redirects and task routes.
 * Read this file to follow a request through the app.
 */

import { fileURLToPath } from "node:url";
import express, { type Express } from "express";
import helmet from "helmet";
import nunjucks from "nunjucks";
import { errorHandler, notFoundHandler } from "./errors/error-pages.ts";
import { TasksClient } from "./features/tasks/tasks.client.ts";
import { createTasksRouter } from "./features/tasks/tasks.routes.ts";
import { contentSecurityPolicy, sameOriginOnly } from "./security.ts";

const publicFolder = fileURLToPath(new URL("../public", import.meta.url));

// Template folders; feature templates render as "tasks/views/index"
const viewsFolder = fileURLToPath(new URL("./views", import.meta.url));
const featuresFolder = fileURLToPath(new URL("./features", import.meta.url));
const govukTemplatesFolder = fileURLToPath(new URL("../govuk-templates", import.meta.url));

export function createApp(options: { apiUrl: string; redirectApiRequests?: boolean }): Express {
  const tasksClient = new TasksClient(options.apiUrl);

  const app = express();
  app.set("trust proxy", true);
  nunjucks.configure([viewsFolder, featuresFolder, govukTemplatesFolder], {
    autoescape: true,
    noCache: process.env.NODE_ENV !== "production",
    express: app,
  });
  app.set("view engine", "njk");

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(contentSecurityPolicy);
  app.use(express.static(publicFolder));
  app.use(express.urlencoded({ extended: false, limit: "10kb" }));
  app.use(sameOriginOnly);

  if (options.redirectApiRequests) {
    app.use("/api", (request, response) => {
      response.redirect(307, new URL(request.originalUrl, options.apiUrl).href);
    });
  }

  app.use(createTasksRouter(tasksClient));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
