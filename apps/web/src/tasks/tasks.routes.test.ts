import type { Express } from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../create-app.ts";
import { findAccessibilityProblems } from "../testing/accessibility.ts";
import { startTestApi, type TestApi } from "../testing/test-api.ts";
import { TasksClient } from "./tasks-client.ts";

const nextYear = new Date().getFullYear() + 1;

const validForm = {
  title: "Prepare hearing bundle",
  description: "Include the witness statements",
  status: "todo",
  "dueDate-day": "15",
  "dueDate-month": "6",
  "dueDate-year": String(nextYear),
  "dueTime-hour": "14",
  "dueTime-minute": "30",
};

let api: TestApi;
let app: Express;

beforeEach(async () => {
  api = await startTestApi();
  app = createApp(new TasksClient(api.url));
});

afterEach(() => {
  api.close();
});

async function createTaskThroughForm(form: object = validForm) {
  return request(app).post("/tasks").type("form").send(form);
}

describe("the task list", () => {
  it("says when there are no tasks", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.text).toContain("There are no tasks.");
  });

  it("lists tasks with their status and due date", async () => {
    await createTaskThroughForm();

    const response = await request(app).get("/");

    expect(response.text).toContain("Prepare hearing bundle");
    expect(response.text).toContain("To do");
    expect(response.text).toContain(`15 June ${nextYear} at 2:30pm`);
  });

  it("has no detectable accessibility problems", async () => {
    await createTaskThroughForm();

    const response = await request(app).get("/");

    expect(await findAccessibilityProblems(response.text)).toEqual([]);
  });
});

describe("creating a task", () => {
  it("shows the form", async () => {
    const response = await request(app).get("/tasks/new");

    expect(response.status).toBe(200);
    expect(response.text).toContain("Create a task");
    expect(await findAccessibilityProblems(response.text)).toEqual([]);
  });

  it("saves the task and shows it with a success banner", async () => {
    const created = await createTaskThroughForm();

    expect(created.status).toBe(303);
    expect(created.headers.location.startsWith("/tasks/")).toBe(true);
    expect(created.headers.location.endsWith("?success=created")).toBe(true);

    const page = await request(app).get(created.headers.location);
    expect(page.text).toContain("Task created");
    expect(page.text).toContain("Include the witness statements");
  });

  it("shows every error at once in an error summary", async () => {
    const response = await createTaskThroughForm({ title: "", status: "todo" });

    expect(response.status).toBe(422);
    expect(response.text).toContain("<title>Error: Create a task");
    expect(response.text).toContain("There is a problem");
    expect(response.text).toContain("Enter a title");
    expect(response.text).toContain("Enter a due date");
    expect(response.text).toContain("Enter a due time");
    expect(await findAccessibilityProblems(response.text)).toEqual([]);
  });

  it("keeps what the user typed when there are errors", async () => {
    const response = await createTaskThroughForm({ ...validForm, "dueDate-day": "" });

    expect(response.text).toContain('value="Prepare hearing bundle"');
    expect(response.text).toContain("Due date must include a day");
  });

  it("rejects a date that does not exist", async () => {
    const response = await createTaskThroughForm({
      ...validForm,
      "dueDate-day": "31",
      "dueDate-month": "2",
    });

    expect(response.text).toContain("Due date must be a real date");
  });

  it("rejects a due date in the past", async () => {
    const response = await createTaskThroughForm({ ...validForm, "dueDate-year": "2020" });

    expect(response.status).toBe(422);
    expect(response.text).toContain("The due date must be in the future");
  });

  it("escapes what the user typed", async () => {
    const created = await createTaskThroughForm({
      ...validForm,
      title: "<script>alert(1)</script>",
    });

    const page = await request(app).get(created.headers.location);

    expect(page.text).not.toContain("<script>alert(1)</script>");
    expect(page.text).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });
});

describe("viewing a task", () => {
  it("shows the task details", async () => {
    const created = await createTaskThroughForm();

    const page = await request(app).get(created.headers.location);

    expect(page.status).toBe(200);
    expect(page.text).toContain("Prepare hearing bundle");
    expect(await findAccessibilityProblems(page.text)).toEqual([]);
  });

  it("shows a not found page for a task that does not exist", async () => {
    const response = await request(app).get("/tasks/00000000-0000-4000-8000-000000000000");

    expect(response.status).toBe(404);
    expect(response.text).toContain("Page not found");
  });
});

describe("when the API is unavailable", () => {
  it("shows a problem page", async () => {
    api.close();

    const response = await request(app).get("/");

    expect(response.status).toBe(500);
    expect(response.text).toContain("Sorry, there is a problem with the service");
  });
});
