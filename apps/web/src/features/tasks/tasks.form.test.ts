/*
 * tasks.form.test.ts
 * Role: Unit tests
 *
 * Checks missing date parts, real dates and times, and decimal-only form parsing.
 */

import { expect, it } from "vitest";
import { emptyTaskForm, findDueAtError, type TaskForm } from "./tasks.form.ts";

const realDueAt: TaskForm = {
  ...emptyTaskForm,
  dueAtDay: "29",
  dueAtMonth: "02",
  dueAtYear: "2028",
  dueAtHour: "09",
  dueAtMinute: "05",
};

it("accepts real decimal date/time parts and reports missing or invalid input", () => {
  expect(findDueAtError(realDueAt)).toBeUndefined();
  expect(findDueAtError(emptyTaskForm)?.message).toBe("Enter a due date and time");
  expect(findDueAtError({ ...realDueAt, dueAtMonth: "" })?.message).toBe(
    "Due date must include a month",
  );
  expect(findDueAtError({ ...realDueAt, dueAtYear: "2027" })?.message).toBe(
    "Due date must be a real date",
  );
  expect(findDueAtError({ ...realDueAt, dueAtYear: "28" })?.message).toBe(
    "Due date must be a real date",
  );
  expect(findDueAtError({ ...realDueAt, dueAtMonth: "0x2" })?.message).toBe(
    "Due date must be a real date",
  );
  expect(findDueAtError({ ...realDueAt, dueAtDay: "1e1" })?.message).toBe(
    "Due date must be a real date",
  );
  expect(findDueAtError({ ...realDueAt, dueAtHour: "" })?.message).toBe(
    "Due time must include an hour",
  );
  expect(findDueAtError({ ...realDueAt, dueAtHour: "+9" })?.message).toBe(
    "Due time must be a real time",
  );
  expect(findDueAtError({ ...realDueAt, dueAtHour: "24" })?.message).toBe(
    "Due time must be a real time",
  );
  expect(findDueAtError({ ...realDueAt, dueAtMinute: "60" })?.message).toBe(
    "Due time must be a real time",
  );
});
