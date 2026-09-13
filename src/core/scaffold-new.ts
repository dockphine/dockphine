import { execa } from "execa";
import ora from "ora";
import fs from "fs-extra";
import type { ProjectConfig, StrapiVersion } from "./types.js";

const VERSION_RANGE: Record<StrapiVersion, { min: number; max: number }> = {
  v4: { min: 18, max: 22 },
  v5: { min: 20, max: 26 },
};

function hostNodeMajor(): number {
  return Number(process.versions.node.split(".")[0]);
}

function hostSatisfies(version: StrapiVersion): boolean {
  const { min, max } = VERSION_RANGE[version];
  const major = hostNodeMajor();
  return major >= min && major <= max;
}

function scaffoldArgs(cfg: ProjectConfig): string[] {
  if (cfg.strapiVersion === "v5") {
    return [
      "--yes",
      "create-strapi-app@latest",
      cfg.projectName,
      "--non-interactive",
      "--no-run",
      "--ts",
      "--use-npm",
      "--no-install",
      "--skip-cloud",
      "--no-git-init",
      "--skip-db",
    ];
  }
  // create-strapi-app@legacy (v4) has no --non-interactive flag; --quickstart is its
  // guaranteed non-interactive path (always sqlite at scaffold time — our docker-generator
  // installs all DB drivers regardless, so the actual dbEngine choice still works at runtime).
  return [
    "--yes",
    "create-strapi-app@legacy",
    cfg.projectName,
    "--quickstart",
    "--no-run",
    "--use-npm",
    "--skip-cloud",
    "--ts",
  ];
}

/**
 * Strapi v4's create-strapi-app hard-blocks on Node > 22 (refuses to scaffold at all, not just a
 * warning). Since this whole tool already requires Docker, when the host Node version is
 * incompatible with the chosen Strapi major version we run the scaffolder inside a throwaway
 * node:20-bookworm-slim container instead — 20 satisfies both v4's (18-22) and v5's (20-26) range.
 */
export async function scaffoldNewProject(cfg: ProjectConfig, cwd: string): Promise<void> {
  if (await fs.pathExists(cfg.projectDir)) {
    const files = await fs.readdir(cfg.projectDir);
    if (files.length > 0) {
      throw new Error(`Directory "${cfg.projectName}" already exists and is not empty.`);
    }
  }

  const args = scaffoldArgs(cfg);
  const useContainer = !hostSatisfies(cfg.strapiVersion);

  const spinner = ora(
    useContainer
      ? `Scaffolding Strapi ${cfg.strapiVersion} inside a temporary Docker container (your local Node.js doesn't satisfy Strapi ${cfg.strapiVersion}'s requirement)...`
      : `Scaffolding Strapi ${cfg.strapiVersion}...`
  ).start();

  try {
    if (useContainer) {
      const dockerArgs = ["run", "--rm", "-v", `${cwd}:/scaffold`, "-w", "/scaffold"];
      if (process.platform !== "win32" && typeof process.getuid === "function") {
        dockerArgs.push("-u", `${process.getuid()}:${process.getgid?.() ?? process.getuid()}`);
      }
      dockerArgs.push(
        "-e",
        "HOME=/tmp",
        "-e",
        "npm_config_cache=/tmp/.npm",
        "node:20-bookworm-slim",
        "npx",
        ...args
      );
      await execa("docker", dockerArgs);
    } else {
      await execa("npx", args, { cwd });
    }
    spinner.succeed(`Strapi ${cfg.strapiVersion} scaffolded.`);
  } catch (err) {
    spinner.fail(`Failed to scaffold Strapi ${cfg.strapiVersion}.`);
    throw err;
  }
}
