import { describe, expect, it } from "vitest";
import { createTaskSchema, isOverdue, type Task } from "./task.ts";

const task: Task = {
  id: "2f1c5a6e-8b1d-4c3a-9f7e-1a2b3c4d5e6f",
  title: "Prepare hearing bundle",
  description: null,
  status: "todo",
  dueAt: "2026-11-02T10:00:00.000Z",
  createdAt: "2026-10-27T09:00:00.000Z",
  updatedAt: "2026-10-27T09:00:00.000Z",
};

describe("createTaskSchema", () => {
  it("trims the title and defaults the status to todo", () => {
    const result = createTaskSchema.parse({
      title: "  Prepare hearing bundle  ",
      dueAt: "2099-11-02T10:00:00.000Z",
    });

    expect(result.title).toBe("Prepare hearing bundle");
    expect(result.status).toBe("todo");
  });

  it("rejects a blank title with a GOV.UK style message", () => {
    const result = createTaskSchema.safeParse({ title: "   ", dueAt: "2099-11-02T10:00:00.000Z" });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Enter a title");
  });

  it("reports a past due date alongside other errors", () => {
    const result = createTaskSchema.safeParse({ title: "", dueAt: "2020-01-01T09:00:00Z" });

    const messages = result.error?.issues.map((issue) => issue.message);
    expect(messages).toEqual(["Enter a title", "The due date must be in the future"]);
  });

  it("rejects fields it does not know about", () => {
    const result = createTaskSchema.safeParse({
      title: "Prepare hearing bundle",
      dueAt: "2099-11-02T10:00:00.000Z",
      priority: "high",
    });

    expect(result.success).toBe(false);
  });
});

describe("isOverdue", () => {
  it("is true when the due date has passed and the task is not done", () => {
    expect(isOverdue(task, new Date("2026-11-03T00:00:00.000Z"))).toBe(true);
  });

  it("is false before the due date", () => {
    expect(isOverdue(task, new Date("2026-11-01T00:00:00.000Z"))).toBe(false);
  });

  it("is false for a done task, however late", () => {
    const doneTask: Task = { ...task, status: "done" };

    expect(isOverdue(doneTask, new Date("2027-01-01T00:00:00.000Z"))).toBe(false);
  });
});
