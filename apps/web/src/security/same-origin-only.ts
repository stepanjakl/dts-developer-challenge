import type { NextFunction, Request, Response } from "express";
import { forbiddenPage } from "../error-pages.ts";

const safeMethods = ["GET", "HEAD", "OPTIONS"];

export function sameOriginOnly(request: Request, response: Response, next: NextFunction) {
  if (safeMethods.includes(request.method) || isSameOrigin(request)) {
    next();
    return;
  }
  response.status(403).render("error", forbiddenPage);
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
