import { z } from "zod";

export const taskStatuses = ["todo", "in_progress", "done"] as const;

export type TaskStatus = (typeof taskStatuses)[number];

export const taskStatusLabels: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

export const taskStatusSchema = z.enum(taskStatuses, { error: "Select a status" });

export const createTaskSchema = z.strictObject({
  title: z
    .string({ error: "Enter a title" })
    .trim()
    .min(1, "Enter a title")
    .max(200, "Title must be 200 characters or fewer"),
  description: z
    .string({ error: "Description must be text" })
    .trim()
    .max(2000, "Description must be 2,000 characters or fewer")
    .optional(),
  status: taskStatusSchema.default("todo"),
  dueAt: z.iso
    .datetime({ offset: true, error: "Enter a due date and time", abort: true })
    .refine(isInTheFuture, "The due date must be in the future"),
});

export const updateTaskStatusSchema = z.strictObject({
  status: taskStatusSchema,
});

export const taskSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  description: z.string().nullable(),
  status: taskStatusSchema,
  dueAt: z.iso.datetime({ offset: true }),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});

export const fieldErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
});

export const problemSchema = z.object({
  title: z.string(),
  status: z.number().int(),
  detail: z.string().optional(),
  errors: z.array(fieldErrorSchema).optional(),
});

export type CreateTaskRequest = z.input<typeof createTaskSchema>;
export type CreateTaskInput = z.output<typeof createTaskSchema>;
export type Task = z.infer<typeof taskSchema>;
export type FieldError = z.infer<typeof fieldErrorSchema>;
export type Problem = z.infer<typeof problemSchema>;

function isInTheFuture(dateTime: string): boolean {
  return new Date(dateTime) > new Date();
}

export function isOverdue(task: Task, now: Date): boolean {
  if (task.status === "done") {
    return false;
  }
  return new Date(task.dueAt) < now;
}
