import type { NextFunction, Request, Response } from "express";
import { TaskNotFoundError } from "./tasks/tasks-client.ts";

export const notFoundPage = {
  heading: "Page not found",
  message: "If you typed the web address, check it is correct.",
};

export const problemPage = {
  heading: "Sorry, there is a problem with the service",
  message: "Try again later.",
};

export const badRequestPage = {
  heading: "There is a problem with your request",
  message: "The form could not be read. Go back and try again.",
};

export const forbiddenPage = {
  heading: "Sorry, this request was blocked",
  message: "Forms on this service can only be sent from this service.",
};

export function notFoundHandler(_request: Request, response: Response) {
  response.status(404).render("error", notFoundPage);
}

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
) {
  if (error instanceof TaskNotFoundError) {
    response.status(404).render("error", notFoundPage);
    return;
  }

  const clientErrorStatus = findClientErrorStatus(error);
  if (clientErrorStatus) {
    response.status(clientErrorStatus).render("error", badRequestPage);
    return;
  }

  console.error(error);
  response.status(500).render("error", problemPage);
}

function findClientErrorStatus(error: unknown): number | undefined {
  if (error instanceof Error && "status" in error && typeof error.status === "number") {
    if (error.status >= 400 && error.status < 500) {
      return error.status;
    }
  }
  return undefined;
}
