/*
 * tasks.routes.ts
 * Role: HTTP routes
 *
 * Validates task requests and coordinates task operations and HTTP responses.
 */

import { Router } from "express";
import { z } from "zod";
import { sendValidationErrors } from "../../errors/error-responses.ts";
import { NotFoundError } from "../../errors/not-found-error.ts";
import { createTaskSchema, updateTaskStatusSchema } from "./tasks.contract.ts";
import type { TasksService } from "./tasks.service.ts";

export function createTasksRouter(tasksService: TasksService): Router {
  const router = Router();

  router.get("/api/tasks", async function listTasks(_request, response) {
    const tasks = await tasksService.listTasks();
    response.json(tasks);
  });

  router.post("/api/tasks", async function createTask(request, response) {
    const result = createTaskSchema.safeParse(request.body);
    if (!result.success) {
      sendValidationErrors(response, result.error);
      return;
    }
    const task = await tasksService.createTask(result.data);
    response.status(201).location(`/api/tasks/${task.id}`).json(task);
  });

  router.get("/api/tasks/:id", async function getTask(request, response) {
    const task = await tasksService.getTask(parseTaskId(request.params.id));
    response.json(task);
  });

  router.patch("/api/tasks/:id/status", async function updateTaskStatus(request, response) {
    const id = parseTaskId(request.params.id);
    const result = updateTaskStatusSchema.safeParse(request.body);
    if (!result.success) {
      sendValidationErrors(response, result.error);
      return;
    }
    const task = await tasksService.updateTaskStatus(id, result.data.status);
    response.json(task);
  });

  router.delete("/api/tasks/:id", async function deleteTask(request, response) {
    await tasksService.deleteTask(parseTaskId(request.params.id));
    response.status(204).end();
  });

  return router;
}

function parseTaskId(value: string): string {
  const result = z.uuid().safeParse(value);
  if (!result.success) {
    throw new NotFoundError(`Task ${value} was not found`);
  }
  return result.data;
}
