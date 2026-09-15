import path from "node:path";
import fs from "fs-extra";
import React from "react";
import { render } from "ink";
import { Command } from "commander";
import { execa } from "execa";
import { Wizard, type WizardResult } from "./ui/Wizard.js";
import { GenerationChecklist, type ChecklistTask } from "./ui/GenerationChecklist.js";
import { OverwriteConfirm } from "./ui/OverwriteConfirm.js";
import { Summary } from "./ui/Summary.js";
import { CancelledError } from "./ui/useCancel.js";
import { scaffoldNewProject } from "./core/scaffold-new.js";
import { generateDockerFiles } from "./core/docker-generator.js";
import { deployAdapters } from "./core/deploy-adapters/index.js";
import { generateAiAgentFiles } from "./core/ai-agent-generator.js";
import { writeEnvFiles } from "./core/env-writer.js";
import { findExistingFiles, writeFiles, WriteAbortedError } from "./core/file-writer.js";
import { generateDbCredentials, generateSecrets } from "./core/secrets.js";
import { checkDocker } from "./core/docker-check.js";
import { NotAStrapiProjectError } from "./core/detect-existing.js";
import { friendlyErrorMessage } from "./utils/error-message.js";
import type { ProjectConfig } from "./core/types.js";

const CLI_VERSION = "1.2.0";

export async function run(): Promise<void> {
  const program = new Command();
  program
    .name("dockphine")
    .description("Scaffold a Dockerized Strapi project (or Dockerize an existing one) in under 2 minutes.")
    .version(CLI_VERSION)
    .parse(process.argv);

  const cwd = process.cwd();

  if (!process.stdin.isTTY) {
    console.error(
      "dockphine needs an interactive terminal (TTY) to run — its prompts can't work piped, " +
        "redirected, or in most CI environments. Run it directly in a terminal."
    );
    process.exitCode = 1;
    return;
  }

  try {
    // Screen 1: wizard — mounts, resolves with the answers, unmounts.
    const wizardInstance = render(React.createElement(Wizard, { cwd }), { exitOnCtrlC: false });
    const wizardResult = (await wizardInstance.waitUntilExit()) as WizardResult;

    const cfg: ProjectConfig = {
      ...wizardResult,
      dbCredentials: generateDbCredentials(wizardResult.projectName),
      secrets: generateSecrets(),
      exampleSecrets: generateSecrets(),
    };

    let effectiveBuildMode = cfg.buildMode;
    let dockerWarning: string | undefined;
    if (cfg.buildMode === "build-now") {
      const dockerStatus = await checkDocker();
      if (!dockerStatus.available) {
        dockerWarning = dockerStatus.message;
        effectiveBuildMode = "scaffold-only";
      }
    }

    await fs.ensureDir(cfg.projectDir);

    // Plain (non-visual) generation — fast, in-memory template rendering, doesn't need its own
    // spinner row, and its output is needed up front to run the overwrite check below.
    const [dockerFiles, deployFiles, aiFiles] = await Promise.all([
      generateDockerFiles(cfg),
      deployAdapters[cfg.deployTarget].generate(cfg),
      generateAiAgentFiles(cfg),
    ]);
    const allGeneratedFiles = [...dockerFiles, ...deployFiles, ...aiFiles];

    // Screen 2 (conditional): overwrite confirmation — must fully unmount before the checklist
    // screen mounts; Ink doesn't support two live render() instances on the same stdout at once.
    const existing = await findExistingFiles(cfg.projectDir, allGeneratedFiles);
    if (existing.length > 0) {
      const confirmInstance = render(React.createElement(OverwriteConfirm, { files: existing }), {
        exitOnCtrlC: false,
      });
      const proceed = await confirmInstance.waitUntilExit();
      if (!proceed) throw new WriteAbortedError();
    }

    // Screen 3: generation checklist
    let writtenFiles: string[] = [];
    let buildAttempted = false;
    let buildSucceeded = false;
    let buildErrorMessage: string | undefined;

    const tasks: ChecklistTask[] = [];

    if (cfg.mode === "new") {
      tasks.push({
        id: "scaffold",
        label: `Scaffolding Strapi ${cfg.strapiVersion}`,
        run: () => scaffoldNewProject(cfg, cwd),
      });
    }

    tasks.push({
      id: "write",
      label: "Writing Docker, deploy, and AI-agent files",
      run: async () => {
        writtenFiles = await writeFiles(cfg.projectDir, allGeneratedFiles);
      },
    });

    tasks.push({
      id: "env",
      label: "Writing environment files",
      run: async () => {
        await writeEnvFiles(cfg);
        writtenFiles = [...writtenFiles, ".env"];
        if (await fs.pathExists(path.join(cfg.projectDir, ".env.example"))) {
          writtenFiles = [...writtenFiles, ".env.example"];
        }
      },
    });

    if (effectiveBuildMode === "build-now") {
      tasks.push({
        id: "build",
        label: "Building and starting containers",
        run: async () => {
          buildAttempted = true;
          try {
            await execa("docker", ["compose", "up", "--build", "-d"], { cwd: cfg.projectDir });
            buildSucceeded = true;
          } catch (err) {
            // Intentionally not rethrown: a failed local build shouldn't abort the whole run —
            // the Summary screen reports it clearly and offers the manual retry command.
            buildErrorMessage = friendlyErrorMessage(err);
          }
        },
      });
    }

    const checklistInstance = render(React.createElement(GenerationChecklist, { tasks }), {
      exitOnCtrlC: false,
    });
    await checklistInstance.waitUntilExit();

    // Screen 4: summary
    const adapter = deployAdapters[cfg.deployTarget];
    const relDir = path.relative(cwd, cfg.projectDir) || ".";

    const summaryInstance = render(
      React.createElement(Summary, {
        writtenFiles,
        projectDir: cfg.projectDir,
        relDir,
        port: cfg.port,
        buildAttempted,
        buildSucceeded,
        buildErrorMessage,
        dockerWarning,
        deployLabel: adapter.label,
        deploySteps: adapter.nextSteps(cfg),
      }),
      { exitOnCtrlC: false }
    );
    await summaryInstance.waitUntilExit();
  } catch (err) {
    if (err instanceof CancelledError) {
      console.log("Cancelled.");
      process.exitCode = 130;
      return;
    }
    if (err instanceof WriteAbortedError) {
      console.log(err.message);
      process.exitCode = 1;
      return;
    }
    if (err instanceof NotAStrapiProjectError) {
      console.error(err.message);
      process.exitCode = 1;
      return;
    }
    console.error(friendlyErrorMessage(err));
    process.exitCode = 1;
  }
}
