import path from "node:path";
import inquirer from "inquirer";
import { detectExistingStrapiProject } from "../core/detect-existing.js";
import { generateDbCredentials, generateSecrets } from "../core/secrets.js";
import { slugify } from "../utils/slugify.js";
import { logger } from "../utils/logger.js";
import type {
  AiAgent,
  BuildMode,
  DbEngine,
  DeployTarget,
  Mode,
  ProjectConfig,
  StrapiVersion,
} from "../core/types.js";

const DEPLOY_TARGET_CHOICES: { name: string; value: DeployTarget }[] = [
  { name: "Generic VPS (any provider you SSH into)", value: "vps" },
  { name: "DigitalOcean Droplet", value: "digitalocean" },
  { name: "Hetzner Cloud", value: "hetzner" },
  { name: "AWS (EC2 / Lightsail)", value: "aws" },
  { name: "Contabo", value: "contabo" },
  { name: "Fly.io", value: "fly" },
  { name: "Railway", value: "railway" },
  { name: "Render", value: "render" },
  { name: "Dokploy", value: "dokploy" },
];

const AI_AGENT_CHOICES: { name: string; value: AiAgent }[] = [
  { name: "Claude Code (CLAUDE.md)", value: "claude" },
  { name: "Cursor (.cursor/rules)", value: "cursor" },
  { name: "GitHub Copilot (.github/copilot-instructions.md)", value: "copilot" },
  { name: "Windsurf (.windsurfrules)", value: "windsurf" },
  { name: "Codex (AGENTS.md)", value: "codex" },
  { name: "Gemini CLI (GEMINI.md)", value: "gemini" },
  { name: "Generic / other (AGENTS.md)", value: "generic" },
];

export async function promptProjectConfig(cwd: string): Promise<ProjectConfig> {
  const { mode } = await inquirer.prompt<{ mode: Mode }>([
    {
      type: "list",
      name: "mode",
      message: "What do you want to do?",
      choices: [
        { name: "Create a new Strapi project", value: "new" },
        { name: "Dockerize an existing Strapi project (in this directory)", value: "existing" },
      ],
    },
  ]);

  let projectName: string;
  let projectDir: string;
  let strapiVersion: StrapiVersion;

  if (mode === "existing") {
    const detected = await detectExistingStrapiProject(cwd);
    projectName = detected.projectName;
    projectDir = cwd;
    strapiVersion = detected.strapiVersion;
    logger.info(`Detected an existing Strapi ${strapiVersion} project: ${projectName}`);
  } else {
    const answers = await inquirer.prompt<{ projectName: string; strapiVersion: StrapiVersion }>([
      {
        type: "input",
        name: "projectName",
        message: "Project name:",
        default: "my-strapi-app",
        validate: (input: string) =>
          slugify(input).length > 0 || "Project name must contain at least one letter or number.",
      },
      {
        type: "list",
        name: "strapiVersion",
        message: "Strapi version:",
        choices: [
          { name: "v5 (latest)", value: "v5" },
          { name: "v4", value: "v4" },
        ],
      },
    ]);
    projectName = slugify(answers.projectName);
    projectDir = path.join(cwd, projectName);
    strapiVersion = answers.strapiVersion;
  }

  const { dbEngine } = await inquirer.prompt<{ dbEngine: DbEngine }>([
    {
      type: "list",
      name: "dbEngine",
      message: "Database:",
      choices: [
        { name: "PostgreSQL", value: "postgres" },
        { name: "MySQL", value: "mysql" },
        { name: "SQLite", value: "sqlite" },
      ],
    },
  ]);

  const { port } = await inquirer.prompt<{ port: number }>([
    {
      type: "input",
      name: "port",
      message: "Port for Strapi to listen on:",
      default: "1337",
      validate: (input: string) => {
        const n = Number(input);
        return (Number.isInteger(n) && n > 0 && n < 65536) || "Enter a valid port number.";
      },
      filter: (input: string) => Number(input),
    },
  ]);

  const { deployTarget } = await inquirer.prompt<{ deployTarget: DeployTarget }>([
    {
      type: "list",
      name: "deployTarget",
      message: "Where will you deploy this?",
      choices: DEPLOY_TARGET_CHOICES,
    },
  ]);

  const { buildMode } = await inquirer.prompt<{ buildMode: BuildMode }>([
    {
      type: "list",
      name: "buildMode",
      message: "After scaffolding, what should happen?",
      choices: [
        { name: "Build and run it locally now (docker compose up --build)", value: "build-now" },
        { name: "Just generate the files — I'll build it myself later", value: "scaffold-only" },
      ],
    },
  ]);

  const { useAI } = await inquirer.prompt<{ useAI: boolean }>([
    {
      type: "confirm",
      name: "useAI",
      message: "Add a project-context file for your AI coding agent?",
      default: true,
    },
  ]);

  let aiAgents: AiAgent[] = [];
  if (useAI) {
    const answer = await inquirer.prompt<{ aiAgents: AiAgent[] }>([
      {
        type: "checkbox",
        name: "aiAgents",
        message: "Which agent(s)? (space to select)",
        choices: AI_AGENT_CHOICES,
        validate: (input) =>
          (Array.isArray(input) && input.length > 0) || "Select at least one agent, or go back and choose No.",
      },
    ]);
    aiAgents = answer.aiAgents;
  }

  const dbCredentials = generateDbCredentials(projectName);
  const secrets = generateSecrets();
  const exampleSecrets = generateSecrets();

  return {
    mode,
    projectName,
    projectDir,
    strapiVersion,
    dbEngine,
    dbCredentials,
    port,
    deployTarget,
    buildMode,
    useAI,
    aiAgents,
    secrets,
    exampleSecrets,
  };
}
