/*
 * index.ts
 * Role: Entry point
 *
 * Creates the API. Vercel serves the exported app; running this file directly
 * also starts a local server.
 */

import { createApp } from "./app.ts";
import { loadConfig } from "./config.ts";
import { createDatabase } from "./db/client.ts";

const config = loadConfig(process.env);
const database = createDatabase(config.databaseUrl);
const app = createApp(database);

export default app;

// Only when run directly, not on Vercel
if (import.meta.main) {
  const server = app.listen(config.port, () => {
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : config.port;
    console.log(`Tasks API running at http://localhost:${port}/api (docs at /api/docs)`);
  });
}
