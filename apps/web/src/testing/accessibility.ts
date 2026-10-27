import axe from "axe-core";
import { JSDOM } from "jsdom";

type WindowWithAxe = JSDOM["window"] & { axe: typeof axe };

export async function findAccessibilityProblems(html: string): Promise<string[]> {
  const dom = new JSDOM(html, { runScripts: "outside-only" });
  const window = dom.window as WindowWithAxe;
  window.eval(axe.source);

  const results = await window.axe.run(window.document, {
    runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
    rules: { "color-contrast": { enabled: false } },
  });

  const problems: string[] = [];
  for (const violation of results.violations) {
    problems.push(`${violation.id}: ${violation.help}`);
  }
  return problems;
}
