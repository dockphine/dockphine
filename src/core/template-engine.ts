import fs from "fs-extra";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Handlebars from "handlebars";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * In dist, this file sits at dist/core/template-engine.js and templates live at
 * dist/templates (copied there by scripts/copy-templates.mjs at build time).
 */
const TEMPLATES_ROOT = path.join(moduleDir, "..", "templates");

let helpersRegistered = false;

function registerHelpers() {
  if (helpersRegistered) return;
  helpersRegistered = true;

  Handlebars.registerHelper("eq", (a: unknown, b: unknown) => a === b);
  Handlebars.registerHelper("includes", (arr: unknown, value: unknown) =>
    Array.isArray(arr) ? arr.includes(value) : false
  );
  Handlebars.registerHelper("join", (arr: unknown, sep: string) =>
    Array.isArray(arr) ? arr.join(sep) : ""
  );
}

async function doRegisterPartials(): Promise<void> {
  const sharedContentPath = path.join(TEMPLATES_ROOT, "agents", "shared-content.hbs");
  if (await fs.pathExists(sharedContentPath)) {
    const content = await fs.readFile(sharedContentPath, "utf-8");
    Handlebars.registerPartial("sharedContent", content);
  }
}

// Shared promise (not a boolean flag) so concurrent renderTemplate() calls all await the
// same in-flight registration instead of racing past it before it actually completes.
let partialsPromise: Promise<void> | undefined;

function registerPartials(): Promise<void> {
  if (!partialsPromise) {
    partialsPromise = doRegisterPartials();
  }
  return partialsPromise;
}

export async function renderTemplate(
  relTemplatePath: string,
  data: Record<string, unknown>
): Promise<string> {
  registerHelpers();
  await registerPartials();

  const fullPath = path.join(TEMPLATES_ROOT, relTemplatePath);
  const source = await fs.readFile(fullPath, "utf-8");
  const template = Handlebars.compile(source, { noEscape: true });
  return template(data);
}

export function templatesRoot(): string {
  return TEMPLATES_ROOT;
}
