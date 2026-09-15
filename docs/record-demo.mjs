#!/usr/bin/env node
// Records a real dockphine wizard session (New Project -> Scaffold only, no live Docker build)
// as an asciinema cast-v2 file, then converts it to docs/demo.gif with `agg`.
//
// Requirements: `dockphine` built + `npm link`'d, `node-pty` installed alongside this script,
// and the `agg` binary (https://github.com/asciinema/agg) on PATH or passed via AGG_BIN.
//
// Usage: node docs/record-demo.mjs [output-gif-path]

import pty from "node-pty";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outGif = process.argv[2] || path.join(__dirname, "demo.gif");
const aggBin = process.env.AGG_BIN || "agg";

const COLS = 100;
const ROWS = 32;

const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "dockphine-demo-"));
const castPath = path.join(workDir, "session.cast");
const castStream = fs.createWriteStream(castPath, { flags: "w" });

const t0 = Date.now();
castStream.write(
  JSON.stringify({
    version: 2,
    width: COLS,
    height: ROWS,
    timestamp: Math.floor(t0 / 1000),
    env: { SHELL: "/bin/bash", TERM: "xterm-256color" },
  }) + "\n"
);

const p = pty.spawn("dockphine", [], {
  name: "xterm-256color",
  cols: COLS,
  rows: ROWS,
  cwd: workDir,
  env: process.env,
});

let resolveFirst;
const firstOutput = new Promise((r) => (resolveFirst = r));
let exited = false;

p.onData((data) => {
  const offset = (Date.now() - t0) / 1000;
  castStream.write(JSON.stringify([offset, "o", data]) + "\n");
  if (resolveFirst) {
    resolveFirst();
    resolveFirst = null;
  }
});
p.onExit(() => {
  exited = true;
});

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const ENTER = "\r";
const DOWN = "[B";
const SPACE = " ";

async function run() {
  await firstOutput;
  await wait(2500); // let Ink/yoga-layout finish its one-time startup cost

  const steps = [
    ["mode: New Project", ENTER],
    ["project name: default", ENTER],
    ["Strapi version: v5", ENTER],
    ["database: PostgreSQL (default, top option)", ENTER],
    ["port: default", ENTER],
    ["deploy config: Yes (default)", ENTER],
    ["deploy target: Generic VPS (default, top option)", ENTER],
    ["build mode: down -> Scaffold only", DOWN],
    [null, ENTER],
    ["AI agent files: Yes (default)", ENTER],
    ["AI agents: select Claude Code", SPACE],
    [null, ENTER],
  ];

  for (const [label, key] of steps) {
    if (label) process.stderr.write(`[${label}]\n`);
    if (key) p.write(key);
    await wait(900);
  }

  process.stderr.write("[waiting for scaffold + write + summary to complete]\n");
  const deadline = Date.now() + 40000;
  while (!exited && Date.now() < deadline) {
    await wait(1000);
  }

  await wait(1500); // hold on the final summary frame briefly before closing
  castStream.end();
  if (!exited) p.kill();

  await wait(300);

  process.stderr.write(`[converting to gif: ${outGif}]\n`);
  execFileSync(aggBin, [castPath, outGif, "--font-size", "16", "--speed", "1.4"], {
    stdio: "inherit",
  });

  process.stderr.write(`[done: ${outGif}]\n`);
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
