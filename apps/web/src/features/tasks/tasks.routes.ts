/*
 * tasks.routes.ts
 * Role: HTTP routes
 *
 * Handles incoming requests and coordinates validation,
 * API calls, page rendering, and redirects.
 */

import { Router } from "express";
import { ukDateTimeToIso } from "../../utils/uk-date-time.ts";
import type { TasksClient } from "./tasks.client.ts";
import {
  emptyTaskForm,
  findDueAtError,
  readDueDate,
  readDueTime,
  readString,
  readTaskForm,
} from "./tasks.form.ts";
import {
  buildErrorSummary,
  buildStatusRadioItems,
  getSuccessMessage,
  prepareTaskForDisplay,
} from "./tasks.view.ts";

export function createTasksRouter(tasksClient: TasksClient): Router {
  const router = Router();

  router.get("/", async (request, response) => {
    const tasks = await tasksClient.listTasks();
    const now = new Date();
    const viewData = {
      tasks: tasks.map((task) => prepareTaskForDisplay(task, now)),
      successMessage: getSuccessMessage(request.query.success),
    };
    response.render("tasks/views/index", viewData);
  });

  router.get("/tasks/new", (_request, response) => {
    const viewData = {
      form: emptyTaskForm,
      errors: {},
      errorSummary: [],
      statusItems: buildStatusRadioItems(emptyTaskForm.status),
    };
    response.render("tasks/views/new", viewData);
  });

  router.post("/tasks", async (request, response) => {
    const form = readTaskForm(request.body);

    const dueAtError = findDueAtError(form);
    let dueAt: string | undefined;
    if (!dueAtError) {
      const dueDate = readDueDate(form);
      const dueTime = readDueTime(form);
      dueAt = ukDateTimeToIso(dueDate, dueTime);
    }

    const result = await tasksClient.createTask({
      title: form.title,
      description: form.description,
      status: form.status,
      dueAt,
    });
    if (result.success) {
      response.redirect(303, `/tasks/${result.data.id}?success=created`);
      return;
    }

    const errors = result.errors;
    if (dueAtError) {
      errors.dueAt = dueAtError.message;
    }
    const viewData = {
      form,
      errors,
      dueDateError: errors.dueAt && dueAtError?.group !== "time" ? errors.dueAt : undefined,
      dueTimeError: dueAtError?.group === "time" ? errors.dueAt : undefined,
      dueAtErrorFields: dueAtError?.fields ?? ["day", "month", "year"],
      errorSummary: buildErrorSummary(errors, dueAtError?.fields[0]),
      statusItems: buildStatusRadioItems(form.status),
    };
    response.status(422).render("tasks/views/new", viewData);
  });

  router.get("/tasks/:id", async (request, response) => {
    const task = await tasksClient.getTask(request.params.id);
    const viewData = {
      task: prepareTaskForDisplay(task, new Date()),
      errors: {},
      errorSummary: [],
      statusItems: buildStatusRadioItems(task.status),
      successMessage: getSuccessMessage(request.query.success),
    };
    response.render("tasks/views/show", viewData);
  });

  router.post("/tasks/:id/status", async (request, response) => {
    const id = request.params.id;

    const status = readString(request.body?.status);
    const result = await tasksClient.updateTaskStatus(id, status);
    if (result.success) {
      response.redirect(303, `/tasks/${result.data.id}?success=status-updated`);
      return;
    }

    const task = await tasksClient.getTask(id);
    const viewData = {
      task: prepareTaskForDisplay(task, new Date()),
      errors: result.errors,
      errorSummary: buildErrorSummary(result.errors),
      statusItems: buildStatusRadioItems(task.status),
    };
    response.status(422).render("tasks/views/show", viewData);
  });

  router.get("/tasks/:id/delete", async (request, response) => {
    const task = await tasksClient.getTask(request.params.id);
    const viewData = { task: prepareTaskForDisplay(task, new Date()) };
    response.render("tasks/views/delete", viewData);
  });

  router.post("/tasks/:id/delete", async (request, response) => {
    await tasksClient.deleteTask(request.params.id);
    response.redirect(303, "/?success=deleted");
  });

  return router;
}
