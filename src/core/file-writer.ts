import fs from "fs-extra";
import path from "node:path";
import type { GeneratedFile } from "./types.js";

export class WriteAbortedError extends Error {
  constructor() {
    super("Aborted: refused to overwrite existing files.");
    this.name = "WriteAbortedError";
  }
}

/** Dedupe by relPath (e.g. codex.hbs and generic.hbs both target AGENTS.md). */
export function dedupe(files: GeneratedFile[]): GeneratedFile[] {
  const map = new Map<string, GeneratedFile>();
  for (const f of files) map.set(f.relPath, f);
  return [...map.values()];
}

/** Pure check — which of these files already exist on disk. No prompting. */
export async function findExistingFiles(baseDir: string, files: GeneratedFile[]): Promise<string[]> {
  const list = dedupe(files);
  const existing: string[] = [];
  for (const f of list) {
    if (await fs.pathExists(path.join(baseDir, f.relPath))) {
      existing.push(f.relPath);
    }
  }
  return existing;
}

/** Pure write — no prompting. Call findExistingFiles() first if a confirmation is needed. */
export async function writeFiles(
  baseDir: string,
  files: GeneratedFile[],
  onFile?: (relPath: string) => void
): Promise<string[]> {
  const list = dedupe(files);
  for (const f of list) {
    const full = path.join(baseDir, f.relPath);
    await fs.ensureDir(path.dirname(full));
    await fs.writeFile(full, f.content, "utf-8");
    onFile?.(f.relPath);
  }
  return list.map((f) => f.relPath);
}
