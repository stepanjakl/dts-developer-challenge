/*
 * error-pages.ts
 * Role: Error pages
 *
 * Renders the not-found, bad-request and server-error pages.
 * Their wording lives in the templates under views/errors.
 */

import type { NextFunction, Request, Response } from "express";
import { recordPageData } from "../page-data/page-data-panel.ts";
import { NotFoundError } from "./not-found-error.ts";

export function notFoundHandler(_request: Request, response: Response) {
  recordPageData("errors/not-found", {});
  response.status(404).render("errors/not-found");
}

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
) {
  if (error instanceof NotFoundError) {
    recordPageData("errors/not-found", {});
    response.status(404).render("errors/not-found");
    return;
  }

  const clientErrorStatus = findClientErrorStatus(error);
  if (clientErrorStatus) {
    recordPageData("errors/bad-request", {});
    response.status(clientErrorStatus).render("errors/bad-request");
    return;
  }

  console.error(error);
  recordPageData("errors/server-error", {});
  response.status(500).render("errors/server-error");
}

// Body-parser errors carry a 4xx status for an unreadable request
function findClientErrorStatus(error: unknown): number | undefined {
  if (error instanceof Error && "status" in error && typeof error.status === "number") {
    if (error.status >= 400 && error.status < 500) {
      return error.status;
    }
  }
  return undefined;
}
