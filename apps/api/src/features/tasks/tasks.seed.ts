/*
 * tasks.seed.ts
 * Role: Demo data
 *
 * Adds demo tasks when the database has none. Run with `npm run db:seed`.
 */

import { loadConfig } from "../../config.ts";
import { createDatabase } from "../../db/client.ts";
import type { TaskStatus } from "./tasks.contract.ts";
import { type NewTaskRecord, tasks } from "./tasks.table.ts";

const config = loadConfig(process.env);
const database = createDatabase(config.databaseUrl);

const existingTasks = await database.select({ id: tasks.id }).from(tasks).limit(1);

if (existingTasks.length > 0) {
  console.log("The database already has tasks, so no demo tasks were added.");
} else {
  await database.insert(tasks).values(demoTasks());
  console.log("Added demo tasks.");
}

function demoTasks(): NewTaskRecord[] {
  return [
    demoTask("Update the court listing for Thursday", "todo", -1, 9),
    demoTask("Contact the applicant about missing documents", "todo", 1, 11),
    demoTask("Prepare the hearing bundle for case 1742", "in_progress", 2, 16),
    demoTask("Check the interpreter booking for case 1690", "todo", 5, 10),
    demoTask("Send the hearing outcome letter for case 1588", "done", -3, 15),
  ];
}

function demoTask(title: string, status: TaskStatus, daysFromNow: number, hour: number) {
  const dueAt = new Date();
  dueAt.setUTCDate(dueAt.getUTCDate() + daysFromNow);
  dueAt.setUTCHours(hour, 0, 0, 0);
  return { title, status, dueAt, description: null };
}
