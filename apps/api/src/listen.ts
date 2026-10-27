import { loadConfig } from "./config.ts";
import app from "./index.ts";

const { port } = loadConfig(process.env);

app.listen(port, () => {
  console.log(`Tasks API running at http://localhost:${port}/api (docs at /api/docs)`);
});
