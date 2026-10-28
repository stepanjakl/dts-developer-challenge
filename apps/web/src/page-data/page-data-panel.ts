/*
 * page-data-panel.ts
 * Role: Page diagnostics
 *
 * Records template values and API attempts separately for each browser request.
 */

import { AsyncLocalStorage } from "node:async_hooks";
import type { RequestHandler } from "express";

// --- Page recording ---
// Give each browser request its own panel data, available to the templates.

type ApiCall = {
  method: string;
  url: string;
  requestBody: string;
  status: number | null;
  responseBody: string;
  error?: string;
};

type PageData = {
  template: string;
  data: string;
  apiCalls: ApiCall[];
};

const currentPage = new AsyncLocalStorage<PageData>();

export const startPageData: RequestHandler = (_request, response, next) => {
  const pageData: PageData = { template: "", data: "{}", apiCalls: [] };
  response.locals.pageData = pageData;
  currentPage.run(pageData, next);
};

// --- Template data ---
// Show which template built the page and the values it received.

export function recordPageData(template: string, data: object) {
  const pageData = currentPage.getStore();
  if (!pageData) {
    return;
  }
  pageData.template = `${template}.njk`;
  pageData.data = formatData(data);
}

// --- API calls ---
// Show what this page sent to the API and what came back.

export async function recordApiCall(
  method: string,
  url: URL,
  body: object | undefined,
  response: Response,
) {
  const pageData = currentPage.getStore();
  if (!pageData) {
    return;
  }
  let responseBody: string;
  try {
    responseBody = formatJson(await response.clone().text());
  } catch {
    responseBody = "The API response body could not be recorded";
  }
  pageData.apiCalls.push({
    method,
    url: url.href,
    requestBody: formatData(body),
    status: response.status,
    responseBody,
  });
}

export function recordApiFailure(
  method: string,
  url: URL,
  body: object | undefined,
  error: unknown,
) {
  const pageData = currentPage.getStore();
  if (!pageData) {
    return;
  }
  let message = "The API request failed";
  if (error instanceof Error) {
    message = error.message;
  }
  pageData.apiCalls.push({
    method,
    url: url.href,
    requestBody: formatData(body),
    status: null,
    responseBody: "",
    error: message,
  });
}

function formatData(data: unknown): string {
  try {
    return JSON.stringify(data, null, 2) ?? "";
  } catch {
    return "Data could not be recorded";
  }
}

function formatJson(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}
