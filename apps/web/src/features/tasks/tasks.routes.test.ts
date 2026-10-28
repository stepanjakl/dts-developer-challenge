/*
 * tasks.routes.test.ts
 * Role: Integration tests
 *
 * Exercises rendered task journeys against a real local API and migrated database.
 */

import type { Express } from "express";
import { JSDOM } from "jsdom";
import request from "supertest";
import { afterEach, beforeEach, expect, it } from "vitest";
import { createApp } from "../../app.ts";
import { findAccessibilityProblems } from "../../testing/accessibility.ts";
import { startTestApi, type TestApi } from "../../testing/test-api.ts";

const validForm = {
  title: "Prepare hearing bundle",
  description: "Include the witness statements",
  status: "todo",
  "dueAt-day": "15",
  "dueAt-month": "6",
  "dueAt-year": String(new Date().getUTCFullYear() + 1),
  "dueAt-hour": "14",
  "dueAt-minute": "30",
};

let api: TestApi | undefined;
let app: Express;

beforeEach(async () => {
  api = undefined;
  api = await startTestApi();
  app = createApp({ apiUrl: api.url });
});

afterEach(async () => {
  await api?.close();
});

it("creates, displays, updates and deletes a task through rendered pages", async () => {
  const emptyList = await request(app).get("/");
  expect(emptyList.status).toBe(200);
  expect(emptyList.text).toContain("There are no tasks.");
  const form = await request(app).get("/tasks/new");
  expect(form.status).toBe(200);
  expect(form.text).toContain('action="/tasks"');
  expect(await findAccessibilityProblems(form.text)).toEqual([]);

  const created = await request(app).post("/tasks").type("form").send(validForm);
  expect(created.status).toBe(303);
  expect(created.headers.location).toMatch(/^\/tasks\/[^?]+\?success=created$/);
  const taskPath = created.headers.location.split("?")[0];
  const detail = await request(app).get(created.headers.location);
  expect(detail.status).toBe(200);
  expect(detail.text).toContain("Task created");
  expect(detail.text).toContain(validForm.description);
  expect(detail.text).toContain(`15 June ${validForm["dueAt-year"]} at 2:30pm`);
  expect(await findAccessibilityProblems(detail.text)).toEqual([]);
  const list = await request(app).get("/");
  expect(list.text).toContain(validForm.title);
  expect(list.text).toContain(taskPath);

  const invalidStatus = await request(app)
    .post(`${taskPath}/status`)
    .type("form")
    .send({ status: "unknown" });
  expect(invalidStatus.status).toBe(422);
  expect(invalidStatus.text).toContain('href="#status"');
  expect(invalidStatus.text).toContain('value="todo" checked');
  const updated = await request(app)
    .post(`${taskPath}/status`)
    .type("form")
    .send({ status: "in_progress" });
  expect(updated.status).toBe(303);
  const updatedPage = await request(app).get(updated.headers.location);
  expect(updatedPage.text).toContain("Status updated");
  expect(updatedPage.text).toContain('value="in_progress" checked');

  const confirmation = await request(app).get(`${taskPath}/delete`);
  expect(confirmation.status).toBe(200);
  expect(confirmation.text).toContain("Are you sure you want to delete this task?");
  expect(confirmation.text).toContain(`href="${taskPath}"`);
  expect(await findAccessibilityProblems(confirmation.text)).toEqual([]);
  expect((await request(app).get(taskPath)).status).toBe(200);
  const deleted = await request(app).post(`${taskPath}/delete`);
  expect(deleted.status).toBe(303);
  expect(deleted.headers.location).toBe("/?success=deleted");
  const finalList = await request(app).get(deleted.headers.location);
  expect(finalList.text).toContain("Task deleted");
  expect(finalList.text).toContain("There are no tasks.");
  const missing = await request(app).get(taskPath);
  expect(missing.status).toBe(404);
  expect(missing.text).toContain("Page not found");
});

it("shows linked field errors, retains input and escapes HTML in the form", async () => {
  const title = `<script>alert(1)</script>${"a".repeat(200)}`;
  const response = await request(app)
    .post("/tasks")
    .type("form")
    .send({
      ...validForm,
      title,
      status: "unknown",
      "dueAt-day": "28",
      "dueAt-month": "3",
      "dueAt-year": "2027",
      "dueAt-hour": "1",
    });
  expect(response.status).toBe(422);
  expect(response.text).toContain("<title>Error: Create a task");
  expect(response.text).not.toContain("<script>alert(1)</script>");
  expect(response.text).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  expect(await findAccessibilityProblems(response.text)).toEqual([]);

  const dom = new JSDOM(response.text);
  try {
    const document = dom.window.document;
    const main = document.querySelector("main");
    expect(main?.textContent).toContain("There is a problem");
    expect(main?.textContent).toContain("Title must be 200 characters or fewer");
    expect(main?.textContent).toContain("Select a status");
    expect(main?.textContent).toContain("clocks go forward");
    expect(main?.textContent).not.toContain("Enter a due date and time");
    expect(main?.querySelector<HTMLInputElement>("#title")?.value).toBe(title);
    expect(main?.querySelector<HTMLTextAreaElement>("#description")?.value).toBe(
      validForm.description,
    );
    expect(main?.querySelector<HTMLInputElement>("#dueAt-hour")?.value).toBe("1");
    const links = main?.querySelectorAll(".govuk-error-summary a");
    expect(Array.from(links ?? [], (link) => link.getAttribute("href"))).toEqual([
      "#title",
      "#status",
      "#dueAt-hour",
    ]);
  } finally {
    dom.window.close();
  }
  const list = await request(app).get("/");
  expect(list.text).toContain("There are no tasks.");
});

it("shows a problem page when the API is unavailable", async () => {
  await api?.close();
  const response = await request(app).get("/");
  expect(response.status).toBe(500);
  expect(response.text).toContain("Sorry, there is a problem with the service");
  expect(response.text).not.toContain("ECONNREFUSED");
});
