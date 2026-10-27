import { randomBytes } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export function contentSecurityPolicy(_request: Request, response: Response, next: NextFunction) {
  const nonce = randomBytes(16).toString("base64");
  response.locals.cspNonce = nonce;
  response.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}'`,
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  );
  next();
}
