/*
 * index.ts
 * Role: Entry point
 *
 * Creates the web app. Vercel serves the exported app; running this file directly
 * also starts a local server.
 */

import type { Express } from "express";
import { createApp } from "./app.ts";
import { loadConfig } from "./config.ts";

const { port, tasksApiUrl } = loadConfig(process.env);

let app: Express;
if (import.meta.main) {
  // Locally, /api requests are redirected to the API
  app = createApp({ apiUrl: tasksApiUrl, redirectApiRequests: true });
  const server = app.listen(port, () => {
    const address = server.address();
    const listeningPort = typeof address === "object" && address ? address.port : port;
    console.log(
      `Task manager running at http://localhost:${listeningPort} (using the API at ${tasksApiUrl})`,
    );
  });
} else {
  // On Vercel, vercel.json routes /api to the API
  app = createApp({ apiUrl: tasksApiUrl });
}

export default app;
