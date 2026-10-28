import type { NextFunction, Request, Response } from "express";
import { NotFoundError, ValidationError } from "../errors.ts";
import type { Problem } from "../tasks/tasks.contract.ts";

type ClientError = Error & { status: number };

const clientErrorTitles: Record<number, string> = {
  400: "Bad request",
  413: "Content too large",
  415: "Unsupported media type",
};

export function notFoundHandler(request: Request, response: Response) {
  sendProblem(response, {
    title: "Not found",
    status: 404,
    detail: `There is no ${request.method} ${request.path} endpoint`,
  });
}

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
) {
  if (error instanceof ValidationError) {
    sendProblem(response, { title: "Invalid request", status: 422, errors: error.fieldErrors });
    return;
  }

  if (error instanceof NotFoundError) {
    sendProblem(response, { title: "Not found", status: 404, detail: error.message });
    return;
  }

  if (isClientError(error)) {
    sendProblem(response, {
      title: clientErrorTitles[error.status] ?? "Bad request",
      status: error.status,
      detail: "The request body could not be read",
    });
    return;
  }

  console.error(error);
  sendProblem(response, { title: "Internal server error", status: 500 });
}

function sendProblem(response: Response, problem: Problem) {
  response.status(problem.status).type("application/problem+json").json(problem);
}

function isClientError(error: unknown): error is ClientError {
  if (!(error instanceof Error) || !("status" in error)) {
    return false;
  }
  if (typeof error.status !== "number") {
    return false;
  }
  return error.status >= 400 && error.status < 500;
}
