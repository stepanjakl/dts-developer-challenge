import { Router } from "express";
import { z } from "zod";
import { NotFoundError } from "../errors.ts";
import { validate } from "../http/validate.ts";
import { createTaskSchema, updateTaskStatusSchema } from "./tasks.contract.ts";
import type { TasksService } from "./tasks.service.ts";

export function createTasksRouter(tasksService: TasksService): Router {
  const router = Router();

  router.get("/", async (_request, response) => {
    const tasks = await tasksService.listTasks();
    response.json(tasks);
  });

  router.post("/", async (request, response) => {
    const input = validate(createTaskSchema, request.body);
    const task = await tasksService.createTask(input);
    response.status(201).location(`/api/tasks/${task.id}`).json(task);
  });

  router.get("/:id", async (request, response) => {
    const task = await tasksService.getTask(parseTaskId(request.params.id));
    response.json(task);
  });

  router.patch("/:id/status", async (request, response) => {
    const id = parseTaskId(request.params.id);
    const input = validate(updateTaskStatusSchema, request.body);
    const task = await tasksService.updateTaskStatus(id, input.status);
    response.json(task);
  });

  router.delete("/:id", async (request, response) => {
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
