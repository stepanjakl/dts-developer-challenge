import { type Task, taskSchema } from "@tasks/contract";
import { z } from "zod";

export class TaskNotFoundError extends Error {}

export class TasksClient {
  baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async listTasks(): Promise<Task[]> {
    const response = await this.send("GET", "/api/tasks");
    return z.array(taskSchema).parse(await response.json());
  }

  async send(method: string, path: string, body?: object): Promise<Response> {
    const request: RequestInit = { method, signal: AbortSignal.timeout(5000) };
    if (body) {
      request.headers = { "Content-Type": "application/json" };
      request.body = JSON.stringify(body);
    }

    const response = await fetch(new URL(path, this.baseUrl), request);
    if (response.ok || response.status === 422) {
      return response;
    }
    if (response.status === 404) {
      throw new TaskNotFoundError(`${method} ${path} was not found`);
    }
    throw new Error(`The tasks API responded to ${method} ${path} with ${response.status}`);
  }
}
