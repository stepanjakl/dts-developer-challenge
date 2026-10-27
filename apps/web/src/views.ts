import { fileURLToPath } from "node:url";
import type { Express } from "express";
import nunjucks from "nunjucks";

const viewsFolder = fileURLToPath(new URL("./views", import.meta.url));
const govukTemplatesFolder = fileURLToPath(new URL("../govuk-templates", import.meta.url));

export function configureViews(app: Express) {
  nunjucks.configure([viewsFolder, govukTemplatesFolder], {
    autoescape: true,
    noCache: process.env.NODE_ENV !== "production",
    express: app,
  });
  app.set("view engine", "njk");
}
