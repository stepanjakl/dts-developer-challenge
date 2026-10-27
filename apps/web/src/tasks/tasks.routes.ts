import { Router } from "express";
import { toTaskView } from "./task-view.ts";
import type { TasksClient } from "./tasks-client.ts";

export function createTasksRouter(tasksClient: TasksClient): Router {
  const router = Router();

  router.get("/", async (_request, response) => {
    const tasks = await tasksClient.listTasks();
    const now = new Date();
    response.render("tasks/index", {
      tasks: tasks.map((task) => toTaskView(task, now)),
    });
  });

  return router;
}
