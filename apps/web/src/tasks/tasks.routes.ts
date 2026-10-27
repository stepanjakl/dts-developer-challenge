import type { Task } from "@tasks/contract";
import { type Response, Router } from "express";
import {
  emptyTaskForm,
  type FormErrors,
  parseDueAt,
  readTaskForm,
  type TaskForm,
  toErrorSummary,
  toFormErrors,
} from "./task-form.ts";
import { statusRadioItems, successMessageFor, toTaskView } from "./task-view.ts";
import type { TasksClient } from "./tasks-client.ts";

export function createTasksRouter(tasksClient: TasksClient): Router {
  const router = Router();

  router.get("/", async (request, response) => {
    const tasks = await tasksClient.listTasks();
    const now = new Date();
    response.render("tasks/index", {
      tasks: tasks.map((task) => toTaskView(task, now)),
      successMessage: successMessageFor(request.query.success),
    });
  });

  router.get("/tasks/new", (_request, response) => {
    renderNewTaskPage(response, emptyTaskForm, {});
  });

  router.post("/tasks", async (request, response) => {
    const form = readTaskForm(request.body);
    const dueAt = parseDueAt(form);
    const result = await tasksClient.createTask({
      title: form.title,
      description: form.description,
      status: form.status,
      dueAt: dueAt.dueAt,
    });

    if (result.saved) {
      response.redirect(303, `/tasks/${result.task.id}?success=created`);
      return;
    }
    response.status(422);
    renderNewTaskPage(response, form, toFormErrors(result.errors, dueAt.errors));
  });

  router.get("/tasks/:id", async (request, response) => {
    const task = await tasksClient.getTask(request.params.id);
    renderTaskPage(response, task, {}, successMessageFor(request.query.success));
  });

  return router;
}

function renderNewTaskPage(response: Response, form: TaskForm, errors: FormErrors) {
  response.render("tasks/new", {
    form,
    errors,
    errorSummary: toErrorSummary(errors),
    statusItems: statusRadioItems(form.status),
  });
}

function renderTaskPage(
  response: Response,
  task: Task,
  errors: FormErrors,
  successMessage?: string,
) {
  response.render("tasks/show", {
    task: toTaskView(task, new Date()),
    errors,
    errorSummary: toErrorSummary(errors),
    statusItems: statusRadioItems(task.status),
    successMessage,
  });
}
