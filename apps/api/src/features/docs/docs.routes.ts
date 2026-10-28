/*
 * docs.routes.ts
 * Role: HTTP routes
 *
 * Builds an OpenAPI document from the app's registered routes and serves Swagger UI.
 */

import { randomBytes } from "node:crypto";
import { type Express, Router } from "express";

const swaggerUiUrl = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.33.1";
const swaggerUiStyleIntegrity =
  "sha384-Ov4/wv3j2bmct8cDc5X4ngJZohVPzEmc6uDPH8WeljUxO5vtoykvMEfbu9Vh6RaW";
const swaggerUiScriptIntegrity =
  "sha384-ZPehFMQommnnuaZ4rpxgkgTT2DKFVp4hZC/7pLit+9Lek9T1YGSo23eHFbvNkXkw";

export function createDocsRouter(app: Express): Router {
  const router = Router();

  router.get("/api/openapi.json", (_request, response) => {
    response.json(createOpenApiDocument(app, router));
  });

  router.get("/api/docs", (_request, response) => {
    const nonce = randomBytes(16).toString("base64");
    response.setHeader(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        `script-src ${swaggerUiUrl}/ 'nonce-${nonce}'`,
        `style-src ${swaggerUiUrl}/ 'unsafe-inline'`,
        "img-src 'self' data:",
        "frame-ancestors 'none'",
      ].join("; "),
    );
    response.type("html").send(docsPage(nonce));
  });

  return router;
}

// --- OpenAPI document ---
// Built at runtime from Express's route table.

const methodsWithBody = ["post", "put", "patch"];

type Layer = Express["router"]["stack"][number];

type Endpoint = {
  method: string;
  path: string;
  handlerName: string;
};

function createOpenApiDocument(app: Express, docsRouter: Router) {
  const paths: Record<string, Record<string, object>> = {};

  for (const endpoint of listEndpoints(app.router.stack, docsRouter)) {
    const parameters = [];
    for (const match of endpoint.path.matchAll(/:(\w+)/g)) {
      parameters.push({ name: match[1], in: "path", required: true, schema: { type: "string" } });
    }

    // :id becomes {id}
    const openApiPath = endpoint.path.replace(/:(\w+)/g, "{$1}");
    if (!paths[openApiPath]) {
      paths[openApiPath] = {};
    }

    // Grouped by the path segment after /api
    const tag = endpoint.path.split("/")[2] ?? "api";

    const operation: Record<string, unknown> = {
      tags: [tag],
      parameters,
      // Needed for Swagger UI to show the response
      responses: { default: { description: "Response from the API" } },
    };
    // Named handlers name the operation
    if (endpoint.handlerName !== "<anonymous>") {
      operation.operationId = endpoint.handlerName;
    }
    // Free-form JSON body, starting as {}
    if (methodsWithBody.includes(endpoint.method)) {
      operation.requestBody = { content: { "application/json": { schema: {}, example: {} } } };
    }
    paths[openApiPath][endpoint.method] = operation;
  }

  // OpenAPI requires a title and version
  return { openapi: "3.1.0", info: { title: "Tasks API", version: "1.0.0" }, paths };
}

// Every route in the app, except the docs routes
function listEndpoints(stack: Layer[], docsRouter: Router): Endpoint[] {
  const endpoints: Endpoint[] = [];

  for (const layer of stack) {
    if (layer.handle === docsRouter) {
      continue;
    }

    if (layer.route) {
      for (const handlerLayer of layer.route.stack) {
        if (handlerLayer.method) {
          endpoints.push({
            method: handlerLayer.method,
            path: layer.route.path,
            handlerName: handlerLayer.name,
          });
        }
      }
      continue;
    }

    if ("stack" in layer.handle) {
      const routerStack = layer.handle.stack as Layer[];
      endpoints.push(...listEndpoints(routerStack, docsRouter));
    }
  }

  return endpoints;
}

function docsPage(nonce: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Tasks API documentation</title>
    <link rel="stylesheet" href="${swaggerUiUrl}/swagger-ui.css" integrity="${swaggerUiStyleIntegrity}" crossorigin="anonymous">
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="${swaggerUiUrl}/swagger-ui-bundle.js" integrity="${swaggerUiScriptIntegrity}" crossorigin="anonymous"></script>
    <script nonce="${nonce}">
      // Hides the copy-path button and curl snippet
      const hideComponents = () => ({
        components: { CopyToClipboardBtn: () => null, curl: () => null },
      });
      SwaggerUIBundle({
        url: "/api/openapi.json",
        dom_id: "#swagger-ui",
        plugins: [hideComponents],
        tryItOutEnabled: true,
        displayRequestDuration: true,
        displayOperationId: true,
        deepLinking: true,
        defaultModelsExpandDepth: -1,
      });
    </script>
  </body>
</html>`;
}
