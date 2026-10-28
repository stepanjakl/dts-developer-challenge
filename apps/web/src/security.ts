/*
 * security.ts
 * Role: Request security
 *
 * Sets the Content Security Policy and blocks form posts from other sites.
 */

import { randomBytes } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { recordPageData } from "./page-data/page-data-panel.ts";

// --- Content Security Policy ---
// The nonce lets GOV.UK Frontend's inline script run.

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

// --- Cross-site form check ---

const safeMethods = ["GET", "HEAD", "OPTIONS"];

export function sameOriginOnly(request: Request, response: Response, next: NextFunction) {
  if (safeMethods.includes(request.method) || isSameOrigin(request)) {
    next();
    return;
  }
  recordPageData("errors/forbidden", {});
  response.status(403).render("errors/forbidden");
}

function isSameOrigin(request: Request): boolean {
  const fetchSite = request.get("Sec-Fetch-Site");
  if (fetchSite) {
    return fetchSite === "same-origin" || fetchSite === "none";
  }

  const origin = request.get("Origin");
  if (!origin) {
    return true;
  }
  return origin === `${request.protocol}://${request.host}`;
}
