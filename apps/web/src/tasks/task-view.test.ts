import type { Task } from "@tasks/contract";
import { describe, expect, it } from "vitest";
import { statusRadioItems, successMessageFor, toTaskView } from "./task-view.ts";

const task: Task = {
  id: "2f1c5a6e-8b1d-4c3a-9f7e-1a2b3c4d5e6f",
  title: "Update the court listing",
  description: null,
  status: "todo",
  dueAt: "2027-03-01T10:00:00.000Z",
  createdAt: "2027-02-01T10:00:00.000Z",
  updatedAt: "2027-02-01T10:00:00.000Z",
};

describe("toTaskView", () => {
  it("marks a late task as overdue", () => {
    const view = toTaskView(task, new Date("2027-03-02T00:00:00.000Z"));

    expect(view.isOverdue).toBe(true);
    expect(view.statusLabel).toBe("To do");
    expect(view.dueText).toBe("1 March 2027 at 10:00am");
  });
});

describe("statusRadioItems", () => {
  it("checks the selected status", () => {
    const checked = statusRadioItems("done").filter((item) => item.checked);

    expect(checked).toEqual([{ value: "done", text: "Done", checked: true }]);
  });
});

describe("successMessageFor", () => {
  it("only shows messages the service defines", () => {
    expect(successMessageFor("deleted")).toBe("Task deleted");
    expect(successMessageFor("constructor")).toBeUndefined();
    expect(successMessageFor("<b>hacked</b>")).toBeUndefined();
  });
});
