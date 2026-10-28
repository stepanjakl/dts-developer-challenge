import type { FieldErrors } from "@tasks/api/problem-details";
import { type CalendarDate, type ClockTime, isRealDate, ukDateTimeToIso } from "../dates.ts";

export type TaskForm = {
  title: string;
  description: string;
  status: string;
  dueDateDay: string;
  dueDateMonth: string;
  dueDateYear: string;
  dueTimeHour: string;
  dueTimeMinute: string;
};

export type FormErrors = {
  title?: string;
  description?: string;
  status?: string;
  dueDate?: string;
  dueTime?: string;
};

export type ErrorSummaryItem = {
  text: string;
  href: string;
};

export type DueAtResult = {
  dueAt?: string;
  errors: FormErrors;
};

export const emptyTaskForm: TaskForm = {
  title: "",
  description: "",
  status: "todo",
  dueDateDay: "",
  dueDateMonth: "",
  dueDateYear: "",
  dueTimeHour: "",
  dueTimeMinute: "",
};

const errorSummaryLinks: { field: keyof FormErrors; href: string }[] = [
  { field: "title", href: "#title" },
  { field: "description", href: "#description" },
  { field: "status", href: "#status" },
  { field: "dueDate", href: "#dueDate-day" },
  { field: "dueTime", href: "#dueTime-hour" },
];

export function readText(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  return "";
}

export function readTaskForm(body: unknown): TaskForm {
  let fields: Record<string, unknown> = {};
  if (typeof body === "object" && body !== null && !Array.isArray(body)) {
    fields = body as Record<string, unknown>;
  }
  return {
    title: readText(fields.title),
    description: readText(fields.description),
    status: readText(fields.status),
    dueDateDay: readText(fields["dueDate-day"]).trim(),
    dueDateMonth: readText(fields["dueDate-month"]).trim(),
    dueDateYear: readText(fields["dueDate-year"]).trim(),
    dueTimeHour: readText(fields["dueTime-hour"]).trim(),
    dueTimeMinute: readText(fields["dueTime-minute"]).trim(),
  };
}

export function parseDueAt(form: TaskForm): DueAtResult {
  const errors: FormErrors = {};

  const date = parseDueDate(form);
  if (typeof date === "string") {
    errors.dueDate = date;
  }

  const time = parseDueTime(form);
  if (typeof time === "string") {
    errors.dueTime = time;
  }

  if (typeof date === "string" || typeof time === "string") {
    return { errors };
  }

  const dueAt = ukDateTimeToIso(date, time);
  if (dueAt === undefined) {
    errors.dueTime =
      "Due time does not exist in UK time because the clocks go forward. Enter a time before 1am or from 2am";
    return { errors };
  }
  return { dueAt, errors };
}

export function toFormErrors(apiErrors: FieldErrors, dueAtErrors: FormErrors): FormErrors {
  const errors: FormErrors = { ...dueAtErrors };
  const hasDueAtError = Boolean(dueAtErrors.dueDate || dueAtErrors.dueTime);

  if (apiErrors.title) {
    errors.title = apiErrors.title;
  }
  if (apiErrors.description) {
    errors.description = apiErrors.description;
  }
  if (apiErrors.status) {
    errors.status = apiErrors.status;
  }
  if (apiErrors.dueAt && !hasDueAtError) {
    errors.dueDate = apiErrors.dueAt;
  }
  return errors;
}

export function toErrorSummary(errors: FormErrors): ErrorSummaryItem[] {
  const items: ErrorSummaryItem[] = [];
  for (const link of errorSummaryLinks) {
    const message = errors[link.field];
    if (message) {
      items.push({ text: message, href: link.href });
    }
  }
  return items;
}

function parseDueDate(form: TaskForm): CalendarDate | string {
  if (form.dueDateDay === "" && form.dueDateMonth === "" && form.dueDateYear === "") {
    return "Enter a due date";
  }
  if (form.dueDateDay === "") {
    return "Due date must include a day";
  }
  if (form.dueDateMonth === "") {
    return "Due date must include a month";
  }
  if (form.dueDateYear === "") {
    return "Due date must include a year";
  }

  const date = {
    day: Number(form.dueDateDay),
    month: Number(form.dueDateMonth),
    year: Number(form.dueDateYear),
  };
  if (date.year < 1000 || date.year > 9999 || !isRealDate(date)) {
    return "Due date must be a real date";
  }
  return date;
}

function parseDueTime(form: TaskForm): ClockTime | string {
  if (form.dueTimeHour === "" && form.dueTimeMinute === "") {
    return "Enter a due time";
  }
  if (form.dueTimeHour === "") {
    return "Due time must include an hour";
  }
  if (form.dueTimeMinute === "") {
    return "Due time must include a minute";
  }

  const time = {
    hour: Number(form.dueTimeHour),
    minute: Number(form.dueTimeMinute),
  };
  if (!isWholeNumberBetween(time.hour, 0, 23) || !isWholeNumberBetween(time.minute, 0, 59)) {
    return "Due time must be a real time";
  }
  return time;
}

function isWholeNumberBetween(value: number, lowest: number, highest: number): boolean {
  return Number.isInteger(value) && value >= lowest && value <= highest;
}
