import type { Express } from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../create-app.ts";
import { createTestDatabase } from "../testing/test-database.ts";

const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
const unknownId = "00000000-0000-4000-8000-000000000000";

let app: Express;

beforeEach(async () => {
  app = createApp(await createTestDatabase());
});

async function createTask(body: object) {
  return request(app).post("/api/tasks").send(body);
}

describe("POST /api/tasks", () => {
  it("creates a task and defaults its status to todo", async () => {
    const response = await createTask({ title: "Prepare hearing bundle", dueAt: nextWeek });

    expect(response.status).toBe(201);
    expect(response.headers.location).toBe(`/api/tasks/${response.body.id}`);
    expect(response.body).toMatchObject({
      title: "Prepare hearing bundle",
      description: null,
      status: "todo",
      dueAt: nextWeek,
    });
  });

  it("stores an empty description as null", async () => {
    const response = await createTask({
      title: "Call applicant",
      description: "  ",
      dueAt: nextWeek,
    });

    expect(response.body.description).toBeNull();
  });

  it("returns every validation error at once", async () => {
    const response = await createTask({ title: "" });

    expect(response.status).toBe(422);
    expect(response.headers["content-type"]).toContain("application/problem+json");
    expect(response.body.errors).toEqual([
      { field: "title", message: "Enter a title" },
      { field: "dueAt", message: "Enter a due date and time" },
    ]);
  });

  it("rejects a due date in the past", async () => {
    const response = await createTask({ title: "Call applicant", dueAt: "2020-01-01T09:00:00Z" });

    expect(response.status).toBe(422);
    expect(response.body.errors).toEqual([
      { field: "dueAt", message: "The due date must be in the future" },
    ]);
  });

  it("rejects an unknown status", async () => {
    const response = await createTask({ title: "Call applicant", dueAt: nextWeek, status: "late" });

    expect(response.status).toBe(422);
    expect(response.body.errors).toEqual([{ field: "status", message: "Select a status" }]);
  });

  it("rejects fields the API does not know about", async () => {
    const response = await createTask({ title: "Call applicant", dueAt: nextWeek, owner: "Sam" });

    expect(response.status).toBe(422);
  });

  it("rejects a body that is not valid JSON", async () => {
    const response = await request(app)
      .post("/api/tasks")
      .set("Content-Type", "application/json")
      .send("{ not json");

    expect(response.status).toBe(400);
    expect(response.body.title).toBe("Bad request");
  });
});

describe("GET /api/tasks", () => {
  it("lists tasks with the soonest due first", async () => {
    await createTask({ title: "Later task", dueAt: nextMonth });
    await createTask({ title: "Sooner task", dueAt: nextWeek });

    const response = await request(app).get("/api/tasks");

    expect(response.status).toBe(200);
    const titles = response.body.map((task: { title: string }) => task.title);
    expect(titles).toEqual(["Sooner task", "Later task"]);
  });
});

describe("GET /api/tasks/:id", () => {
  it("returns the task", async () => {
    const created = await createTask({ title: "Call applicant", dueAt: nextWeek });

    const response = await request(app).get(`/api/tasks/${created.body.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(created.body);
  });

  it("returns 404 for a task that does not exist", async () => {
    const response = await request(app).get(`/api/tasks/${unknownId}`);

    expect(response.status).toBe(404);
  });

  it("returns 404 for an ID that is not a UUID", async () => {
    const response = await request(app).get("/api/tasks/not-a-uuid");

    expect(response.status).toBe(404);
  });
});

describe("PATCH /api/tasks/:id/status", () => {
  it("updates the status", async () => {
    const created = await createTask({ title: "Call applicant", dueAt: nextWeek });

    const response = await request(app)
      .patch(`/api/tasks/${created.body.id}/status`)
      .send({ status: "in_progress" });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("in_progress");
    expect(response.body.updatedAt >= created.body.updatedAt).toBe(true);
  });

  it("rejects an invalid status", async () => {
    const created = await createTask({ title: "Call applicant", dueAt: nextWeek });

    const response = await request(app)
      .patch(`/api/tasks/${created.body.id}/status`)
      .send({ status: "finished" });

    expect(response.status).toBe(422);
  });

  it("returns 404 for a task that does not exist", async () => {
    const response = await request(app)
      .patch(`/api/tasks/${unknownId}/status`)
      .send({ status: "done" });

    expect(response.status).toBe(404);
  });
});

describe("DELETE /api/tasks/:id", () => {
  it("deletes the task", async () => {
    const created = await createTask({ title: "Call applicant", dueAt: nextWeek });

    const response = await request(app).delete(`/api/tasks/${created.body.id}`);
    const afterwards = await request(app).get(`/api/tasks/${created.body.id}`);

    expect(response.status).toBe(204);
    expect(afterwards.status).toBe(404);
  });

  it("returns 404 for a task that does not exist", async () => {
    const response = await request(app).delete(`/api/tasks/${unknownId}`);

    expect(response.status).toBe(404);
  });
});
