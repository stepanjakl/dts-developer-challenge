import { loadConfig } from "./config.ts";
import { createApp } from "./create-app.ts";
import { TasksClient } from "./tasks/tasks-client.ts";

const config = loadConfig(process.env);

export default createApp(new TasksClient(config.tasksApiUrl));
