import { type FieldError, problemSchema, type Task, taskSchema } from "@tasks/contract";
import { z } from "zod";

export type TaskSubmission = {
  title: string;
  description: string;
  status: string;
  dueAt?: string;
};

export type SaveResult = { saved: true; task: Task } | { saved: false; errors: FieldError[] };

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

  async getTask(id: string): Promise<Task> {
    const response = await this.send("GET", taskPath(id));
    return taskSchema.parse(await response.json());
  }

  async createTask(submission: TaskSubmission): Promise<SaveResult> {
    const response = await this.send("POST", "/api/tasks", submission);
    return readSaveResult(response);
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

function taskPath(id: string): string {
  return `/api/tasks/${encodeURIComponent(id)}`;
}

async function readSaveResult(response: Response): Promise<SaveResult> {
  const body = await response.json();
  if (response.status === 422) {
    const problem = problemSchema.parse(body);
    return { saved: false, errors: problem.errors ?? [] };
  }
  return { saved: true, task: taskSchema.parse(body) };
}
