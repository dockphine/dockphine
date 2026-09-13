import fs from "fs-extra";
import path from "node:path";
import inquirer from "inquirer";
import cliProgress from "cli-progress";
import chalk from "chalk";
import type { GeneratedFile } from "./types.js";

export class WriteAbortedError extends Error {
  constructor() {
    super("Aborted: refused to overwrite existing files.");
    this.name = "WriteAbortedError";
  }
}

/** Dedupe by relPath (e.g. codex.ts and generic.ts both target AGENTS.md). */
function dedupe(files: GeneratedFile[]): GeneratedFile[] {
  const map = new Map<string, GeneratedFile>();
  for (const f of files) map.set(f.relPath, f);
  return [...map.values()];
}

export async function writeGeneratedFiles(
  baseDir: string,
  files: GeneratedFile[]
): Promise<string[]> {
  const list = dedupe(files);

  const existing: string[] = [];
  for (const f of list) {
    if (await fs.pathExists(path.join(baseDir, f.relPath))) {
      existing.push(f.relPath);
    }
  }

  if (existing.length > 0) {
    const { overwrite } = await inquirer.prompt<{ overwrite: boolean }>([
      {
        type: "confirm",
        name: "overwrite",
        message:
          `These files already exist and will be overwritten:\n` +
          existing.map((p) => `  ${chalk.yellow(p)}`).join("\n") +
          `\nContinue?`,
        default: false,
      },
    ]);
    if (!overwrite) throw new WriteAbortedError();
  }

  const bar = new cliProgress.SingleBar(
    {
      format: `Generating files |${chalk.cyan("{bar}")}| {value}/{total} {filename}`,
      hideCursor: true,
    },
    cliProgress.Presets.shades_classic
  );
  bar.start(list.length, 0, { filename: "" });

  for (const f of list) {
    const full = path.join(baseDir, f.relPath);
    await fs.ensureDir(path.dirname(full));
    await fs.writeFile(full, f.content, "utf-8");
    bar.increment({ filename: f.relPath });
  }

  bar.stop();
  return list.map((f) => f.relPath);
}
