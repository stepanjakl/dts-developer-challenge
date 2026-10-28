/*
 * test-api.ts
 * Role: Test support
 *
 * Starts a local API with its own database and closes both resources explicitly.
 */

import { once } from "node:events";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "@tasks/api/app";
import { createTestDatabase } from "@tasks/api/test-database";

export type TestApi = {
  url: string;
  close: () => Promise<void>;
};

export async function startTestApi(): Promise<TestApi> {
  const testDatabase = await createTestDatabase();
  const server = createServer();
  try {
    server.on("request", createApp(testDatabase.database));
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
  } catch (error) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await testDatabase.close();
    throw error;
  }
  const address = server.address() as AddressInfo;
  let closed = false;
  return {
    url: `http://127.0.0.1:${address.port}`,
    close: async () => {
      if (closed) {
        return;
      }
      closed = true;
      try {
        await new Promise<void>((resolve, reject) => {
          server.close((error) => {
            if (error) {
              reject(error);
              return;
            }
            resolve();
          });
        });
      } finally {
        await testDatabase.close();
      }
    },
  };
}
