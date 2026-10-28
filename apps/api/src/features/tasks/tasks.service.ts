/*
 * tasks.service.ts
 * Role: Task operations
 *
 * Handles missing tasks, normalises input and maps stored records to API responses.
 */

import { NotFoundError } from "../../errors/not-found-error.ts";
import type { CreateTaskInput, Task, TaskStatus } from "./tasks.contract.ts";
import type { TasksRepository } from "./tasks.repository.ts";
import type { TaskRecord } from "./tasks.table.ts";

export class TasksService {
  private readonly repository: TasksRepository;

  constructor(repository: TasksRepository) {
    this.repository = repository;
  }

  async listTasks(): Promise<Task[]> {
    const records = await this.repository.findAll();
    return records.map(toTaskResponse);
  }

  async getTask(id: string): Promise<Task> {
    const record = await this.repository.findById(id);
    if (!record) {
      throw new NotFoundError(`Task ${id} was not found`);
    }
    return toTaskResponse(record);
  }

  async createTask(input: CreateTaskInput): Promise<Task> {
    const record = await this.repository.insert({
      title: input.title,
      description: input.description || null,
      status: input.status,
      dueAt: new Date(input.dueAt),
    });
    return toTaskResponse(record);
  }

  async updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
    const record = await this.repository.updateStatus(id, status);
    if (!record) {
      throw new NotFoundError(`Task ${id} was not found`);
    }
    return toTaskResponse(record);
  }

  async deleteTask(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new NotFoundError(`Task ${id} was not found`);
    }
  }
}

function toTaskResponse(record: TaskRecord): Task {
  return {
    id: record.id,
    title: record.title,
    description: record.description,
    status: record.status,
    dueAt: record.dueAt.toISOString(),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
