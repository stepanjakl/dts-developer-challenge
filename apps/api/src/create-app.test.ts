import type { Express } from "express";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "./create-app.ts";
import { createTestDatabase } from "./testing/test-database.ts";

let app: Express;

beforeAll(async () => {
  app = createApp(await createTestDatabase());
});

describe("the API app", () => {
  it("reports that it is healthy", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("answers unknown routes with a problem response", async () => {
    const response = await request(app).get("/api/unknown");

    expect(response.status).toBe(404);
    expect(response.headers["content-type"]).toContain("application/problem+json");
  });

  it("sends security headers", async () => {
    const response = await request(app).get("/api/health");

    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-powered-by"]).toBeUndefined();
  });
});
