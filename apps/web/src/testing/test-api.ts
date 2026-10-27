import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { createApp } from "@tasks/api/create-app";
import { createTestDatabase } from "@tasks/api/test-database";

export type TestApi = {
  url: string;
  close: () => void;
};

export async function startTestApi(): Promise<TestApi> {
  const server = createApp(await createTestDatabase()).listen(0);
  await once(server, "listening");
  const address = server.address() as AddressInfo;
  return {
    url: `http://localhost:${address.port}`,
    close: () => server.close(),
  };
}
