import { copyFileSync, cpSync, mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as sass from "sass";

const webFolder = fileURLToPath(new URL("..", import.meta.url));
const assetsFolder = path.join(webFolder, "public", "assets");
const templatesFolder = path.join(webFolder, "govuk-templates", "govuk");
const govukFrontendFolder = path.join(
  path.dirname(fileURLToPath(import.meta.resolve("govuk-frontend/package.json"))),
  "dist",
  "govuk",
);

mkdirSync(assetsFolder, { recursive: true });

const styles = sass.compile(path.join(webFolder, "src", "styles", "application.scss"), {
  importers: [new sass.NodePackageImporter()],
  style: "compressed",
  quietDeps: true,
});
writeFileSync(path.join(assetsFolder, "application.css"), styles.css);

copyFileSync(
  path.join(govukFrontendFolder, "govuk-frontend.min.js"),
  path.join(assetsFolder, "govuk-frontend.min.js"),
);
copyFileSync(
  path.join(webFolder, "src", "assets", "application.js"),
  path.join(assetsFolder, "application.js"),
);

rmSync(templatesFolder, { recursive: true, force: true });
cpSync(govukFrontendFolder, templatesFolder, { recursive: true, filter: isFolderOrTemplate });

console.log("Built public/assets and govuk-templates");

function isFolderOrTemplate(source: string): boolean {
  return statSync(source).isDirectory() || source.endsWith(".njk");
}
