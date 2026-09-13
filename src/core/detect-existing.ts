import fs from "fs-extra";
import path from "node:path";
import type { StrapiVersion } from "./types.js";

export class NotAStrapiProjectError extends Error {
  constructor(dir: string) {
    super(
      `No @strapi/strapi dependency found in ${path.join(dir, "package.json")}. ` +
        `Run this command from the root of an existing Strapi project, or choose "New Project" instead.`
    );
    this.name = "NotAStrapiProjectError";
  }
}

export interface DetectedProject {
  strapiVersion: StrapiVersion;
  projectName: string;
}

export async function detectExistingStrapiProject(cwd: string): Promise<DetectedProject> {
  const pkgPath = path.join(cwd, "package.json");

  if (!(await fs.pathExists(pkgPath))) {
    throw new NotAStrapiProjectError(cwd);
  }

  const pkg = await fs.readJson(pkgPath);
  const range: string | undefined =
    pkg.dependencies?.["@strapi/strapi"] ?? pkg.devDependencies?.["@strapi/strapi"];

  if (!range) {
    throw new NotAStrapiProjectError(cwd);
  }

  const majorMatch = range.match(/(\d+)/);
  const major = majorMatch ? Number(majorMatch[1]) : 5;
  const strapiVersion: StrapiVersion = major >= 5 ? "v5" : "v4";

  return {
    strapiVersion,
    projectName: pkg.name ?? path.basename(cwd),
  };
}
