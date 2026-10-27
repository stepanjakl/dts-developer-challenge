import { loadConfig } from "./config.ts";
import app from "./index.ts";

const { port, tasksApiUrl } = loadConfig(process.env);

app.listen(port, () => {
  console.log(`Task manager running at http://localhost:${port} (using the API at ${tasksApiUrl})`);
});
