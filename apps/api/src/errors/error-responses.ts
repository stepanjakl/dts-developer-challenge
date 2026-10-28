/*
 * error-responses.ts
 * Role: Error responses
 *
 * Sends problem responses: field errors from routes, then missing tasks and routes,
 * unreadable requests and unexpected failures from the catch-all handlers.
 */

import { STATUS_CODES } from "node:http";
import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";
import { NotFoundError } from "./not-found-error.ts";
import type { FieldErrors, Problem } from "./problem-details.ts";

// Status names for problem titles (Node's own list uses older names for 413 and 422)
const statusPhrases: Record<number, string> = {
  400: "Bad Request",
  404: "Not Found",
  413: "Content Too Large",
  415: "Unsupported Media Type",
  422: "Unprocessable Content",
  500: "Internal Server Error",
};

// Invalid input, keeping the first message for each field
export function sendValidationErrors(response: Response, error: z.ZodError) {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    let field = "body";
    if (issue.path.length > 0) {
      field = issue.path.join(".");
    }
    if (!errors[field]) {
      errors[field] = issue.message;
    }
  }
  sendProblem(response, 422, { errors });
}

export function notFoundHandler(request: Request, response: Response) {
  sendProblem(response, 404, {
    detail: `There is no ${request.method} ${request.path} endpoint`,
  });
}

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
) {
  if (error instanceof NotFoundError) {
    sendProblem(response, 404, { detail: error.message });
    return;
  }

  const clientErrorStatus = findClientErrorStatus(error);
  if (clientErrorStatus) {
    sendProblem(response, clientErrorStatus, { detail: "The request body could not be read" });
    return;
  }

  console.error(error);
  sendProblem(response, 500);
}

function sendProblem(
  response: Response,
  status: number,
  details: { detail?: string; errors?: FieldErrors } = {},
) {
  const title = statusPhrases[status] ?? STATUS_CODES[status] ?? "Error";
  const problem: Problem = { title, status, ...details };
  response.status(status).type("application/problem+json").json(problem);
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
