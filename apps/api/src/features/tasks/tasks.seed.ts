/*
 * tasks.seed.ts
 * Role: Demo data
 *
 * Adds demo tasks when the database has none. Run with `npm run db:seed`.
 */

import { loadConfig } from "../../config.ts";
import { createDatabase } from "../../db/client.ts";
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

// The tasks of building this service; UK time is GMT on these dates, so they are written in UTC
function demoTasks(): NewTaskRecord[] {
  return [
    {
      title: "Read the brief. Read it again.",
      description:
        "Create, view, update, delete. Sounds simple enough. What could possibly go wrong?",
      status: "done",
      dueAt: new Date("2026-10-27T13:00:00Z"),
    },
    {
      title: "Break up with Java (it's not you, it's me)",
      description:
        "Spring Boot seems lovely, but TypeScript and I already have a good thing going.",
      status: "done",
      dueAt: new Date("2026-10-27T14:00:00Z"),
    },
    {
      title: "Build a website like it's 1999",
      description:
        "HTML forms, server-rendered pages and actual submit buttons. Turns out the old ways still work.",
      status: "done",
      dueAt: new Date("2026-10-27T19:00:00Z"),
    },
    {
      title: "Investigate the missing hour",
      description:
        "1:30am on 28 March 2027 doesn't exist in the UK. The clocks stole it. Make sure the app doesn't accept it.",
      status: "done",
      dueAt: new Date("2026-10-28T11:00:00Z"),
    },
    {
      title: "See what axe didn't catch",
      description:
        "Automated checks are green. Time to put the mouse away and test with a keyboard and screen reader.",
      status: "todo",
      dueAt: new Date("2026-10-28T18:00:00Z"),
    },
    {
      title: "Send it off into the world",
      description:
        "Push the code, check the deployment, send HMCTS the links and hope nothing breaks five minutes later.",
      status: "in_progress",
      dueAt: new Date("2026-11-05T23:55:00Z"),
    },
  ];
}
