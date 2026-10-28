/*
 * tasks.contract.test.ts
 * Role: Unit tests
 *
 * Checks the overdue rule at, before and after the due time.
 */

import { expect, it } from "vitest";
import { isOverdue, type Task } from "./tasks.contract.ts";

it("marks unfinished tasks overdue only after their due time", () => {
  const task: Task = {
    id: "2f1c5a6e-8b1d-4c3a-9f7e-1a2b3c4d5e6f",
    title: "Prepare hearing bundle",
    description: null,
    status: "todo",
    dueAt: "2026-11-02T10:00:00.000Z",
    createdAt: "2026-10-27T09:00:00.000Z",
    updatedAt: "2026-10-27T09:00:00.000Z",
  };
  expect(isOverdue(task, new Date("2026-11-01T00:00:00Z"))).toBe(false);
  expect(isOverdue(task, new Date(task.dueAt))).toBe(false);
  expect(isOverdue(task, new Date("2026-11-03T00:00:00Z"))).toBe(true);
  expect(isOverdue({ ...task, status: "done" }, new Date("2026-11-03T00:00:00Z"))).toBe(false);
});
