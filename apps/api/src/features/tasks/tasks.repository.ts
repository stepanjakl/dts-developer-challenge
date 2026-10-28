/*
 * tasks.repository.ts
 * Role: Database access
 *
 * Runs task queries and returns database records to the task service.
 */

import { asc, eq } from "drizzle-orm";
import type { Database } from "../../db/client.ts";
import type { TaskStatus } from "./tasks.contract.ts";
import { type NewTaskRecord, type TaskRecord, tasks } from "./tasks.table.ts";

export class TasksRepository {
  private readonly database: Database;

  constructor(database: Database) {
    this.database = database;
  }

  async findAll(): Promise<TaskRecord[]> {
    return this.database.select().from(tasks).orderBy(asc(tasks.dueAt));
  }

  async findById(id: string): Promise<TaskRecord | undefined> {
    const rows = await this.database.select().from(tasks).where(eq(tasks.id, id));
    return rows[0];
  }

  async insert(values: NewTaskRecord): Promise<TaskRecord> {
    const rows = await this.database.insert(tasks).values(values).returning();
    const record = rows[0];
    if (!record) {
      throw new Error("Task insert did not return the created record");
    }
    return record;
  }

  async updateStatus(id: string, status: TaskStatus): Promise<TaskRecord | undefined> {
    const rows = await this.database
      .update(tasks)
      .set({ status, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return rows[0];
  }

  async delete(id: string): Promise<boolean> {
    const rows = await this.database
      .delete(tasks)
      .where(eq(tasks.id, id))
      .returning({ id: tasks.id });
    return rows.length > 0;
  }
}
