/*
 * tasks.form.ts
 * Role: Form input
 *
 * Defines form values, reads submitted fields,
 * and checks form-specific input.
 */

import { taskErrorMessages } from "@tasks/api/tasks-contract";
import {
  type CalendarDate,
  type ClockTime,
  isRealDate,
  isRealTime,
  ukDateTimeToIso,
} from "../../utils/uk-date-time.ts";

// Messages for the separate date and time fields
const dueAtFieldMessages = {
  missingDay: "Due date must include a day",
  missingMonth: "Due date must include a month",
  missingYear: "Due date must include a year",
  notRealDate: "Due date must be a real date",
  missingTime: "Enter a due time",
  missingHour: "Due time must include an hour",
  missingMinute: "Due time must include a minute",
  notRealTime: "Due time must be a real time",
  nonexistentUkTime:
    "Due time does not exist in UK time because the clocks go forward. Enter a time before 1am or from 2am",
};

// --- Form values ---
// Fields and starting values for the task form.

export type TaskForm = {
  title: string;
  description: string;
  status: string;
  dueAtDay: string;
  dueAtMonth: string;
  dueAtYear: string;
  dueAtHour: string;
  dueAtMinute: string;
};

export const emptyTaskForm: TaskForm = {
  title: "",
  description: "",
  status: "todo",
  dueAtDay: "",
  dueAtMonth: "",
  dueAtYear: "",
  dueAtHour: "",
  dueAtMinute: "",
};

// --- Reading inputs ---
// Turn submitted fields into strings the form can use.

export function readString(value: unknown): string {
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
    title: readString(fields.title),
    description: readString(fields.description),
    status: readString(fields.status),
    dueAtDay: readString(fields["dueAt-day"]).trim(),
    dueAtMonth: readString(fields["dueAt-month"]).trim(),
    dueAtYear: readString(fields["dueAt-year"]).trim(),
    dueAtHour: readString(fields["dueAt-hour"]).trim(),
    dueAtMinute: readString(fields["dueAt-minute"]).trim(),
  };
}

// --- Date validation ---
// Find the first missing or invalid date or time field.

export function findDueAtError(
  form: TaskForm,
): { message: string; group: "date" | "time"; fields: string[] } | undefined {
  if (form.dueAtDay === "" && form.dueAtMonth === "" && form.dueAtYear === "") {
    return {
      message: taskErrorMessages.dueAt.missing,
      group: "date",
      fields: ["day", "month", "year"],
    };
  }
  if (form.dueAtDay === "") {
    return { message: dueAtFieldMessages.missingDay, group: "date", fields: ["day"] };
  }
  if (form.dueAtMonth === "") {
    return { message: dueAtFieldMessages.missingMonth, group: "date", fields: ["month"] };
  }
  if (form.dueAtYear === "") {
    return { message: dueAtFieldMessages.missingYear, group: "date", fields: ["year"] };
  }
  if (!isRealDate(readDueDate(form))) {
    return {
      message: dueAtFieldMessages.notRealDate,
      group: "date",
      fields: ["day", "month", "year"],
    };
  }
  if (form.dueAtHour === "" && form.dueAtMinute === "") {
    return { message: dueAtFieldMessages.missingTime, group: "time", fields: ["hour", "minute"] };
  }
  if (form.dueAtHour === "") {
    return { message: dueAtFieldMessages.missingHour, group: "time", fields: ["hour"] };
  }
  if (form.dueAtMinute === "") {
    return { message: dueAtFieldMessages.missingMinute, group: "time", fields: ["minute"] };
  }
  if (!isRealTime(readDueTime(form))) {
    return { message: dueAtFieldMessages.notRealTime, group: "time", fields: ["hour", "minute"] };
  }
  if (ukDateTimeToIso(readDueDate(form), readDueTime(form)) === undefined) {
    return {
      message: dueAtFieldMessages.nonexistentUkTime,
      group: "time",
      fields: ["hour", "minute"],
    };
  }
  return undefined;
}

// --- Date parts ---
// Convert the separate form fields into numbers for validation and conversion.

export function readDueDate(form: TaskForm): CalendarDate {
  return {
    year: readDateTimePart(form.dueAtYear),
    month: readDateTimePart(form.dueAtMonth),
    day: readDateTimePart(form.dueAtDay),
  };
}

export function readDueTime(form: TaskForm): ClockTime {
  return {
    hour: readDateTimePart(form.dueAtHour),
    minute: readDateTimePart(form.dueAtMinute),
  };
}

function readDateTimePart(value: string): number {
  if (!/^\d+$/.test(value)) {
    return Number.NaN;
  }
  return Number(value);
}
