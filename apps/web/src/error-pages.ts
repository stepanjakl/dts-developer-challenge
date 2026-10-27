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
  console.error(error);
  response.status(500).render("error", problemPage);
}
