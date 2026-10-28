/*
 * tasks.contract.ts
 * Role: Shared contract
 *
 * Defines task inputs, task responses, validation messages and timing rules.
 * The web app imports it too, so it only imports zod.
 */

import { z } from "zod";

// --- Validation messages ---

export const taskErrorMessages = {
  title: {
    missing: "Enter a title",
    tooLong: "Title must be 200 characters or fewer",
  },
  description: {
    notText: "Description must be text",
    tooLong: "Description must be 2,000 characters or fewer",
  },
  status: {
    missing: "Select a status",
  },
  dueAt: {
    missing: "Enter a due date and time",
    inThePast: "The due date must be in the future",
  },
};

// --- Status options ---

export const taskStatuses = ["todo", "in_progress", "done"] as const;

export type TaskStatus = (typeof taskStatuses)[number];

export const taskStatusLabels: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

export const taskStatusSchema = z.enum(taskStatuses, { error: taskErrorMessages.status.missing });

// --- Task input ---

export const createTaskSchema = z.strictObject({
  title: z
    .string({ error: taskErrorMessages.title.missing })
    .trim()
    .min(1, taskErrorMessages.title.missing)
    .max(200, taskErrorMessages.title.tooLong),
  description: z
    .string({ error: taskErrorMessages.description.notText })
    .trim()
    .max(2000, taskErrorMessages.description.tooLong)
    .optional(),
  status: taskStatusSchema.default("todo"),
  dueAt: z.iso
    .datetime({ offset: true, error: taskErrorMessages.dueAt.missing, abort: true })
    .refine(isInTheFuture, taskErrorMessages.dueAt.inThePast),
});

export type CreateTaskInput = z.output<typeof createTaskSchema>;

export const updateTaskStatusSchema = z.strictObject({
  status: taskStatusSchema,
});

// --- Task responses ---

export const taskSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  description: z.string().nullable(),
  status: taskStatusSchema,
  dueAt: z.iso.datetime({ offset: true }),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});

export type Task = z.infer<typeof taskSchema>;

// --- Timing rules ---

function isInTheFuture(dateTime: string): boolean {
  return new Date(dateTime) > new Date();
}

export function isOverdue(task: Task, now: Date): boolean {
  if (task.status === "done") {
    return false;
  }
  return new Date(task.dueAt) < now;
}
