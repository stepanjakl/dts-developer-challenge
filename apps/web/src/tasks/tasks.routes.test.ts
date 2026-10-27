import type { Express } from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../create-app.ts";
import { startTestApi, type TestApi } from "../testing/test-api.ts";
import { TasksClient } from "./tasks-client.ts";

let api: TestApi;
let app: Express;

beforeEach(async () => {
  api = await startTestApi();
  app = createApp(new TasksClient(api.url));
});

afterEach(() => {
  api.close();
});

describe("the task list", () => {
  it("says when there are no tasks", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.text).toContain("There are no tasks.");
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
