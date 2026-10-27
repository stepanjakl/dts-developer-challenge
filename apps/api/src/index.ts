import { loadConfig } from "./config.ts";
import { createApp } from "./create-app.ts";
import { createDatabase } from "./db/client.ts";

const config = loadConfig(process.env);

export default createApp(createDatabase(config.databaseUrl));
