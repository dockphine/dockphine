import React, { useEffect, useState } from "react";
import path from "node:path";
import { Box, useApp } from "ink";
import { Spinner } from "@inkjs/ui";
import { WelcomeBanner } from "./WelcomeBanner.js";
import { StepList, type Step } from "./StepList.js";
import { SelectQuestion } from "./questions/SelectQuestion.js";
import { TextQuestion } from "./questions/TextQuestion.js";
import { MultiSelectQuestion } from "./questions/MultiSelectQuestion.js";
import { ConfirmQuestion } from "./questions/ConfirmQuestion.js";
import { useCancelOnCtrlC } from "./useCancel.js";
import { detectExistingStrapiProject } from "../core/detect-existing.js";
import { slugify } from "../utils/slugify.js";
import type {
  AiAgent,
  BuildMode,
  DbEngine,
  DeployTarget,
  Mode,
  StrapiVersion,
} from "../core/types.js";

export interface WizardResult {
  mode: Mode;
  projectName: string;
  projectDir: string;
  strapiVersion: StrapiVersion;
  dbEngine: DbEngine;
  port: number;
  deployTarget: DeployTarget;
  buildMode: BuildMode;
  useAI: boolean;
  aiAgents: AiAgent[];
}

const DEPLOY_TARGET_CHOICES: { label: string; value: DeployTarget }[] = [
  { label: "Generic VPS (any provider you SSH into)", value: "vps" },
  { label: "DigitalOcean Droplet", value: "digitalocean" },
  { label: "Hetzner Cloud", value: "hetzner" },
  { label: "AWS (EC2 / Lightsail)", value: "aws" },
  { label: "Contabo", value: "contabo" },
  { label: "Fly.io", value: "fly" },
  { label: "Railway", value: "railway" },
  { label: "Render", value: "render" },
  { label: "Dokploy", value: "dokploy" },
];

const AI_AGENT_CHOICES: { label: string; value: AiAgent }[] = [
  { label: "Claude Code (.claude/skills/dockphine)", value: "claude" },
  { label: "Cursor (.cursor/rules)", value: "cursor" },
  { label: "GitHub Copilot (.github/copilot-instructions.md)", value: "copilot" },
  { label: "Windsurf (.windsurfrules)", value: "windsurf" },
  { label: "Codex (AGENTS.md)", value: "codex" },
  { label: "Gemini CLI (GEMINI.md)", value: "gemini" },
  { label: "Generic / other (AGENTS.md)", value: "generic" },
];

type StepId =
  | "mode"
  | "detecting"
  | "projectName"
  | "strapiVersion"
  | "dbEngine"
  | "port"
  | "wantDeploy"
  | "deployTarget"
  | "buildMode"
  | "useAI"
  | "aiAgents";

interface WizardProps {
  cwd: string;
}

export function Wizard({ cwd }: WizardProps): React.JSX.Element {
  const { exit } = useApp();
  useCancelOnCtrlC();

  const [step, setStep] = useState<StepId>("mode");
  const [mode, setMode] = useState<Mode>();
  const [projectName, setProjectName] = useState<string>();
  const [projectDir, setProjectDir] = useState<string>();
  const [strapiVersion, setStrapiVersion] = useState<StrapiVersion>();
  const [dbEngine, setDbEngine] = useState<DbEngine>();
  const [port, setPort] = useState<number>();
  const [wantDeploy, setWantDeploy] = useState<boolean>();
  const [deployTarget, setDeployTarget] = useState<DeployTarget>();
  const [buildMode, setBuildMode] = useState<BuildMode>();
  const [useAI, setUseAI] = useState<boolean>();

  // Runs as soon as mode becomes "existing" — reads package.json in cwd.
  useEffect(() => {
    if (step !== "detecting") return;
    let cancelled = false;
    (async () => {
      try {
        const detected = await detectExistingStrapiProject(cwd);
        if (cancelled) return;
        setProjectName(detected.projectName);
        setProjectDir(cwd);
        setStrapiVersion(detected.strapiVersion);
        setStep("dbEngine");
      } catch (err) {
        if (!cancelled) exit(err instanceof Error ? err : new Error(String(err)));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [step, cwd, exit]);

  const dbEngineLabel: Record<DbEngine, string> = {
    postgres: "PostgreSQL",
    mysql: "MySQL",
    sqlite: "SQLite",
  };
  const buildModeLabel: Record<BuildMode, string> = {
    "build-now": "Build & run now",
    "scaffold-only": "Scaffold only",
  };

  const steps: Step[] = [
    { id: "mode", label: "Mode", detail: mode === "new" ? "New Project" : mode === "existing" ? "Existing Project" : undefined },
  ];
  if (mode === "new" || mode === undefined) {
    steps.push(
      { id: "projectName", label: "Project name", detail: projectName },
      {
        id: "strapiVersion",
        label: "Strapi version",
        detail: strapiVersion === "v5" ? "v5 (latest)" : strapiVersion,
      }
    );
  }
  steps.push(
    { id: "dbEngine", label: "Database", detail: dbEngine ? dbEngineLabel[dbEngine] : undefined },
    { id: "port", label: "Port", detail: port ? String(port) : undefined },
    {
      id: "wantDeploy",
      label: "Deploy config",
      detail: wantDeploy === undefined ? undefined : wantDeploy ? "Yes" : "Skipped",
    }
  );
  if (wantDeploy !== false) {
    steps.push({
      id: "deployTarget",
      label: "Deploy target",
      detail: deployTarget && deployTarget !== "none"
        ? DEPLOY_TARGET_CHOICES.find((o) => o.value === deployTarget)?.label
        : undefined,
    });
  }
  steps.push(
    { id: "buildMode", label: "Build mode", detail: buildMode ? buildModeLabel[buildMode] : undefined },
    { id: "useAI", label: "AI agent files", detail: useAI === undefined ? undefined : useAI ? "Yes" : "No" }
  );
  if (useAI !== false) {
    steps.push({ id: "aiAgents", label: "AI agents" });
  }

  const currentIndex = (() => {
    if (step === "detecting") {
      const dbIdx = steps.findIndex((s) => s.id === "dbEngine");
      return dbIdx < 0 ? 0 : dbIdx;
    }
    const idx = steps.findIndex((s) => s.id === step);
    return idx < 0 ? 0 : idx;
  })();

  function finish(overrides: Pick<WizardResult, "useAI" | "aiAgents">) {
    exit({
      mode: mode!,
      projectName: projectName!,
      projectDir: projectDir!,
      strapiVersion: strapiVersion!,
      dbEngine: dbEngine!,
      port: port!,
      deployTarget: deployTarget!,
      buildMode: buildMode!,
      ...overrides,
    } satisfies WizardResult);
  }

  return (
    <Box flexDirection="column">
      <WelcomeBanner />
      <StepList steps={steps} currentIndex={currentIndex} />

      {step === "mode" && (
        <SelectQuestion
          message="What do you want to do?"
          options={[
            { label: "Create a new Strapi project", value: "new" as Mode },
            {
              label: "Dockerize an existing Strapi project (in this directory)",
              value: "existing" as Mode,
            },
          ]}
          onSubmit={(value) => {
            setMode(value);
            setStep(value === "existing" ? "detecting" : "projectName");
          }}
        />
      )}

      {step === "detecting" && (
        <Box>
          <Spinner label="Detecting existing Strapi project..." />
        </Box>
      )}

      {step === "projectName" && (
        <TextQuestion
          message="Project name:"
          defaultValue="my-strapi-app"
          validate={(value) =>
            slugify(value).length > 0
              ? undefined
              : "Project name must contain at least one letter or number."
          }
          onSubmit={(value) => {
            const slug = slugify(value);
            setProjectName(slug);
            setProjectDir(path.join(cwd, slug));
            setStep("strapiVersion");
          }}
        />
      )}

      {step === "strapiVersion" && (
        <SelectQuestion
          message="Strapi version:"
          options={[
            { label: "v5 (latest)", value: "v5" as StrapiVersion },
            { label: "v4", value: "v4" as StrapiVersion },
          ]}
          onSubmit={(value) => {
            setStrapiVersion(value);
            setStep("dbEngine");
          }}
        />
      )}

      {step === "dbEngine" && (
        <SelectQuestion
          message="Database:"
          options={[
            { label: "PostgreSQL", value: "postgres" as DbEngine },
            { label: "MySQL", value: "mysql" as DbEngine },
            { label: "SQLite", value: "sqlite" as DbEngine },
          ]}
          onSubmit={(value) => {
            setDbEngine(value);
            setStep("port");
          }}
        />
      )}

      {step === "port" && (
        <TextQuestion
          message="Port for Strapi to listen on:"
          defaultValue="1337"
          validate={(value) => {
            const n = Number(value);
            return Number.isInteger(n) && n > 0 && n < 65536 ? undefined : "Enter a valid port number.";
          }}
          onSubmit={(value) => {
            setPort(Number(value));
            setStep("wantDeploy");
          }}
        />
      )}

      {step === "wantDeploy" && (
        <ConfirmQuestion
          message="Add deploy config for a hosting target (VPS, Fly.io, Railway, Render, Dokploy)?"
          defaultValue={true}
          onSubmit={(value) => {
            setWantDeploy(value);
            if (value) {
              setStep("deployTarget");
            } else {
              setDeployTarget("none");
              setStep("buildMode");
            }
          }}
        />
      )}

      {step === "deployTarget" && (
        <SelectQuestion
          message="Where will you deploy this?"
          options={DEPLOY_TARGET_CHOICES}
          onSubmit={(value) => {
            setDeployTarget(value);
            setStep("buildMode");
          }}
        />
      )}

      {step === "buildMode" && (
        <SelectQuestion
          message="After scaffolding, what should happen?"
          options={[
            {
              label: "Build and run it locally now (docker compose up --build)",
              value: "build-now" as BuildMode,
            },
            {
              label: "Just generate the files — I'll build it myself later",
              value: "scaffold-only" as BuildMode,
            },
          ]}
          onSubmit={(value) => {
            setBuildMode(value);
            setStep("useAI");
          }}
        />
      )}

      {step === "useAI" && (
        <ConfirmQuestion
          message="Add a project-context file for your AI coding agent?"
          defaultValue={true}
          onSubmit={(value) => {
            setUseAI(value);
            if (value) {
              setStep("aiAgents");
            } else {
              finish({ useAI: false, aiAgents: [] });
            }
          }}
        />
      )}

      {step === "aiAgents" && (
        <MultiSelectQuestion
          message="Which agent(s)?"
          options={AI_AGENT_CHOICES}
          onSubmit={(values) => {
            finish({ useAI: true, aiAgents: values });
          }}
        />
      )}
    </Box>
  );
}
