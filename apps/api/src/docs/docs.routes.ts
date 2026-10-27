import { randomBytes } from "node:crypto";
import { Router } from "express";
import { createOpenApiDocument } from "./openapi.ts";

const swaggerUiUrl = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.33.1";
const swaggerUiStyleIntegrity =
  "sha384-Ov4/wv3j2bmct8cDc5X4ngJZohVPzEmc6uDPH8WeljUxO5vtoykvMEfbu9Vh6RaW";
const swaggerUiScriptIntegrity =
  "sha384-ZPehFMQommnnuaZ4rpxgkgTT2DKFVp4hZC/7pLit+9Lek9T1YGSo23eHFbvNkXkw";

export function createDocsRouter(): Router {
  const router = Router();
  const openApiDocument = createOpenApiDocument();

  router.get("/openapi.json", (_request, response) => {
    response.json(openApiDocument);
  });

  router.get("/docs", (_request, response) => {
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
      SwaggerUIBundle({ url: "/api/openapi.json", dom_id: "#swagger-ui" });
    </script>
  </body>
</html>`;
}
