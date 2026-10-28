/*
 * client.ts
 * Role: API client
 *
 * Sends backend HTTP requests and records responses or failed attempts for the page.
 */

import { type FieldErrors, problemSchema } from "@tasks/api/problem-details";
import type { z } from "zod";
import { NotFoundError } from "../errors/not-found-error.ts";
import { recordApiCall, recordApiFailure } from "../page-data/page-data-panel.ts";

// Shared request setup for calls to the backend
export class ApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async sendRequest(
    method: string,
    path: string,
    body?: object,
    expectedErrorStatuses: number[] = [],
  ): Promise<Response> {
    const request: RequestInit = { method, signal: AbortSignal.timeout(5000) };
    if (body !== undefined) {
      request.headers = { "Content-Type": "application/json" };
      request.body = JSON.stringify(body);
    }

    const url = new URL(path, this.baseUrl);
    let response: Response;
    try {
      response = await fetch(url, request);
    } catch (error) {
      recordApiFailure(method, url, body, error);
      throw error;
    }
    await recordApiCall(method, url, body, response);
    if (response.ok || expectedErrorStatuses.includes(response.status)) {
      return response;
    }

    // Any other status is unexpected; a missing task shows the not-found page
    const message = `The API responded to ${method} ${path} with ${response.status}`;
    if (response.status === 404) {
      throw new NotFoundError(message);
    }
    throw new Error(message);
  }

  // Form input the API validates: a 422 returns its field errors
  async submit<Data>(
    method: string,
    path: string,
    body: object,
    schema: z.ZodType<Data>,
  ): Promise<{ success: true; data: Data } | { success: false; errors: FieldErrors }> {
    const response = await this.sendRequest(method, path, body, [422]);
    const responseBody = await response.json();
    if (response.status === 422) {
      const problem = problemSchema.parse(responseBody);
      return { success: false, errors: problem.errors ?? {} };
    }
    return { success: true, data: schema.parse(responseBody) };
  }
}
