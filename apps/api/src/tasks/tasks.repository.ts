import { asc, eq } from "drizzle-orm";
import type { Database } from "../db/client.ts";
import { type NewTaskRecord, type TaskRecord, tasks } from "../db/schema.ts";
import type { TaskStatus } from "./tasks.contract.ts";

export class TasksRepository {
  database: Database;

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
    return rows[0];
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
