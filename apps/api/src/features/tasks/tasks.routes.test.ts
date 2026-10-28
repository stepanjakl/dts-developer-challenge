/*
 * tasks.routes.test.ts
 * Role: Integration tests
 *
 * Exercises task lifecycle, validation and missing-record responses with real migrations.
 */

import type { Express } from "express";
import request from "supertest";
import { afterEach, beforeEach, expect, it } from "vitest";
import { createApp } from "../../app.ts";
import { createTestDatabase, type TestDatabase } from "../../testing/test-database.ts";

let testDatabase: TestDatabase | undefined;
let app: Express;

beforeEach(async () => {
  testDatabase = undefined;
  testDatabase = await createTestDatabase();
  app = createApp(testDatabase.database);
});

afterEach(async () => {
  await testDatabase?.close();
});

it("creates, lists, reads, updates and deletes tasks", async () => {
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const later = await request(app)
    .post("/api/tasks")
    .send({ title: "Later task", dueAt: nextMonth });
  const created = await request(app).post("/api/tasks").send({
    title: "  Prepare hearing bundle  ",
    description: "  ",
    dueAt: nextWeek,
  });
  expect(later.status).toBe(201);
  expect(created.status).toBe(201);
  expect(created.body).toMatchObject({
    title: "Prepare hearing bundle",
    description: null,
    status: "todo",
    dueAt: nextWeek,
  });
  const taskPath = `/api/tasks/${created.body.id}`;
  expect(created.headers.location).toBe(taskPath);

  const list = await request(app).get("/api/tasks");
  expect(list.status).toBe(200);
  expect(list.body.map((task: { id: string }) => task.id)).toEqual([
    created.body.id,
    later.body.id,
  ]);
  const detail = await request(app).get(taskPath);
  expect(detail.status).toBe(200);
  expect(detail.body).toEqual(created.body);

  const updated = await request(app).patch(`${taskPath}/status`).send({ status: "in_progress" });
  expect(updated.status).toBe(200);
  expect(updated.body.status).toBe("in_progress");
  expect(updated.body.updatedAt >= created.body.updatedAt).toBe(true);
  expect((await request(app).get(taskPath)).body.status).toBe("in_progress");

  expect((await request(app).delete(taskPath)).status).toBe(204);
  expect((await request(app).get(taskPath)).status).toBe(404);
  expect(
    (await request(app).get("/api/tasks")).body.map((task: { id: string }) => task.id),
  ).toEqual([later.body.id]);
});

it("returns field errors together without saving invalid input", async () => {
  const response = await request(app).post("/api/tasks").send({ title: "", status: "unknown" });
  expect(response.status).toBe(422);
  expect(response.headers["content-type"]).toContain("application/problem+json");
  expect(response.body).toEqual({
    title: "Unprocessable Content",
    status: 422,
    errors: {
      title: "Enter a title",
      status: "Select a status",
      dueAt: "Enter a due date and time",
    },
  });
  expect((await request(app).get("/api/tasks")).body).toEqual([]);
});

it("returns a problem response for missing tasks and malformed IDs", async () => {
  for (const id of ["00000000-0000-4000-8000-000000000000", "not-a-uuid"]) {
    const response = await request(app).get(`/api/tasks/${id}`);
    expect(response.status).toBe(404);
    expect(response.headers["content-type"]).toContain("application/problem+json");
    expect(response.body).toEqual({
      title: "Not Found",
      status: 404,
      detail: `Task ${id} was not found`,
    });
  }
});
