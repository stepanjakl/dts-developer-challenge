/*
 * tasks.client.ts
 * Role: API client
 *
 * Defines endpoint calls and checks API responses.
 */

import type { FieldErrors } from "@tasks/api/problem-details";
import { type Task, taskSchema } from "@tasks/api/tasks-contract";
import { z } from "zod";
import { ApiClient } from "../../api/client.ts";

export class TasksClient {
  private readonly apiClient: ApiClient;

  constructor(baseUrl: string) {
    this.apiClient = new ApiClient(baseUrl);
  }

  async listTasks(): Promise<Task[]> {
    const response = await this.apiClient.sendRequest("GET", "/api/tasks");
    return z.array(taskSchema).parse(await response.json());
  }

  async getTask(id: string): Promise<Task> {
    const response = await this.apiClient.sendRequest(
      "GET",
      `/api/tasks/${encodeURIComponent(id)}`,
    );
    return taskSchema.parse(await response.json());
  }

  async createTask(submission: {
    title: string;
    description: string;
    status: string;
    dueAt?: string;
  }): Promise<{ success: true; data: Task } | { success: false; errors: FieldErrors }> {
    return this.apiClient.submit("POST", "/api/tasks", submission, taskSchema);
  }

  async updateTaskStatus(
    id: string,
    status: string,
  ): Promise<{ success: true; data: Task } | { success: false; errors: FieldErrors }> {
    const path = `/api/tasks/${encodeURIComponent(id)}/status`;
    return this.apiClient.submit("PATCH", path, { status }, taskSchema);
  }

  async deleteTask(id: string): Promise<void> {
    await this.apiClient.sendRequest("DELETE", `/api/tasks/${encodeURIComponent(id)}`);
  }
}
