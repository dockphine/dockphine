import path from "node:path";
import fs from "fs-extra";
import { Command } from "commander";
import { execa } from "execa";
import ora from "ora";
import { promptProjectConfig } from "./prompts/index.js";
import { scaffoldNewProject } from "./core/scaffold-new.js";
import { generateDockerFiles } from "./core/docker-generator.js";
import { deployAdapters } from "./core/deploy-adapters/index.js";
import { generateAiAgentFiles } from "./core/ai-agent-generator.js";
import { writeEnvFiles } from "./core/env-writer.js";
import { writeGeneratedFiles, WriteAbortedError } from "./core/file-writer.js";
import { NotAStrapiProjectError } from "./core/detect-existing.js";
import { logger } from "./utils/logger.js";

const CLI_VERSION = "1.0.0";

function isCancelError(err: unknown): boolean {
  return Boolean(
    err && typeof err === "object" && "name" in err && (err as { name?: string }).name === "ExitPromptError"
  );
}

export async function run(): Promise<void> {
  const program = new Command();
  program
    .name("dockphine")
    .description("Scaffold a Dockerized Strapi project (or Dockerize an existing one) in under 2 minutes.")
    .version(CLI_VERSION)
    .parse(process.argv);

  const cwd = process.cwd();

  logger.title("dockphine");
  logger.info("Dockerize Strapi in under 2 minutes.\n");

  try {
    const cfg = await promptProjectConfig(cwd);

    if (cfg.mode === "new") {
      await scaffoldNewProject(cfg, cwd);
    }

    await fs.ensureDir(cfg.projectDir);

    const [dockerFiles, deployFiles, aiFiles] = await Promise.all([
      generateDockerFiles(cfg),
      deployAdapters[cfg.deployTarget].generate(cfg),
      generateAiAgentFiles(cfg),
    ]);

    const written = await writeGeneratedFiles(cfg.projectDir, [
      ...dockerFiles,
      ...deployFiles,
      ...aiFiles,
    ]);

    await writeEnvFiles(cfg);
    written.push(".env");
    if (await fs.pathExists(path.join(cfg.projectDir, ".env.example"))) {
      written.push(".env.example");
    }

    logger.divider();
    logger.success(`Generated ${written.length} files in ${cfg.projectDir}`);
    for (const f of written.sort()) logger.info(`  ${f}`);

    const adapter = deployAdapters[cfg.deployTarget];
    const relDir = path.relative(cwd, cfg.projectDir) || ".";

    if (cfg.buildMode === "build-now") {
      const spinner = ora("Running docker compose up --build...").start();
      try {
        await execa("docker", ["compose", "up", "--build", "-d"], { cwd: cfg.projectDir });
        spinner.succeed("Containers built and started.");
        logger.success(`Strapi admin: http://localhost:${cfg.port}/admin`);
        logger.info(`Follow logs with: cd ${relDir} && docker compose logs -f`);
      } catch (err) {
        spinner.fail("docker compose up --build failed.");
        logger.error(err instanceof Error ? err.message : String(err));
        logger.info(`You can retry manually: cd ${relDir} && docker compose up --build`);
      }
    } else {
      logger.divider();
      logger.step("Next steps:");
      logger.command(`cd ${relDir}`);
      logger.command("docker compose up --build");
    }

    logger.divider();
    logger.step(`Deploying to ${adapter.label}:`);
    for (const step of adapter.nextSteps(cfg)) logger.command(step);

    logger.divider();
    logger.success("Done.");
  } catch (err) {
    if (err instanceof WriteAbortedError) {
      logger.warn(err.message);
      process.exitCode = 1;
      return;
    }
    if (err instanceof NotAStrapiProjectError) {
      logger.error(err.message);
      process.exitCode = 1;
      return;
    }
    if (isCancelError(err)) {
      logger.warn("Cancelled.");
      process.exitCode = 130;
      return;
    }
    logger.error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  }
}
