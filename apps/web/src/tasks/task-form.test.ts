import { describe, expect, it } from "vitest";
import {
  emptyTaskForm,
  parseDueAt,
  type TaskForm,
  toErrorSummary,
  toFormErrors,
} from "./task-form.ts";

function formWith(values: Partial<TaskForm>): TaskForm {
  return { ...emptyTaskForm, ...values };
}

const winterDueDate = formWith({
  dueDateDay: "15",
  dueDateMonth: "1",
  dueDateYear: "2099",
  dueTimeHour: "9",
  dueTimeMinute: "5",
});

describe("parseDueAt", () => {
  it("turns UK date and time fields into an ISO date time", () => {
    expect(parseDueAt(winterDueDate)).toEqual({ dueAt: "2099-01-15T09:05:00.000Z", errors: {} });
  });

  it("asks for both the date and the time when they are empty", () => {
    expect(parseDueAt(emptyTaskForm).errors).toEqual({
      dueDate: "Enter a due date",
      dueTime: "Enter a due time",
    });
  });

  it("names the missing part of the date", () => {
    const form = { ...winterDueDate, dueDateMonth: "" };

    expect(parseDueAt(form).errors.dueDate).toBe("Due date must include a month");
  });

  it("rejects dates that do not exist", () => {
    const form = { ...winterDueDate, dueDateDay: "30", dueDateMonth: "2" };

    expect(parseDueAt(form).errors.dueDate).toBe("Due date must be a real date");
  });

  it("rejects text in the date", () => {
    const form = { ...winterDueDate, dueDateYear: "next" };

    expect(parseDueAt(form).errors.dueDate).toBe("Due date must be a real date");
  });

  it("rejects times outside the 24-hour clock", () => {
    const form = { ...winterDueDate, dueTimeHour: "24" };

    expect(parseDueAt(form).errors.dueTime).toBe("Due time must be a real time");
  });
});

describe("toFormErrors", () => {
  it("puts API errors on the matching form fields", () => {
    const errors = toFormErrors(
      [
        { field: "title", message: "Enter a title" },
        { field: "dueAt", message: "The due date must be in the future" },
      ],
      {},
    );

    expect(errors).toEqual({
      title: "Enter a title",
      dueDate: "The due date must be in the future",
    });
  });

  it("prefers the form's own date error over the API's", () => {
    const errors = toFormErrors([{ field: "dueAt", message: "Enter a due date and time" }], {
      dueDate: "Due date must include a day",
    });

    expect(errors).toEqual({ dueDate: "Due date must include a day" });
  });
});

describe("toErrorSummary", () => {
  it("links each error to its field, in the order the fields appear", () => {
    const summary = toErrorSummary({ dueTime: "Enter a due time", title: "Enter a title" });

    expect(summary).toEqual([
      { text: "Enter a title", href: "#title" },
      { text: "Enter a due time", href: "#dueTime-hour" },
    ]);
  });
});
