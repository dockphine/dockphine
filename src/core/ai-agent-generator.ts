import { renderTemplate } from "./template-engine.js";
import { deployAdapters } from "./deploy-adapters/index.js";
import type { AiAgent, GeneratedFile, ProjectConfig } from "./types.js";

const AGENT_FILES: Record<AiAgent, { template: string; relPath: string }> = {
  claude: { template: "agents/claude.hbs", relPath: "CLAUDE.md" },
  cursor: { template: "agents/cursor.hbs", relPath: ".cursor/rules/dockphine.mdc" },
  copilot: { template: "agents/copilot.hbs", relPath: ".github/copilot-instructions.md" },
  windsurf: { template: "agents/windsurf.hbs", relPath: ".windsurfrules" },
  codex: { template: "agents/codex.hbs", relPath: "AGENTS.md" },
  gemini: { template: "agents/gemini.hbs", relPath: "GEMINI.md" },
  generic: { template: "agents/generic.hbs", relPath: "AGENTS.md" },
};

export async function generateAiAgentFiles(cfg: ProjectConfig): Promise<GeneratedFile[]> {
  if (!cfg.useAI || cfg.aiAgents.length === 0) return [];

  const adapter = deployAdapters[cfg.deployTarget];
  const data = {
    projectName: cfg.projectName,
    strapiVersion: cfg.strapiVersion,
    dbEngine: cfg.dbEngine,
    port: cfg.port,
    isExisting: cfg.mode === "existing",
    deployTargetLabel: adapter.label,
    nextSteps: adapter.nextSteps(cfg),
  };

  const files: GeneratedFile[] = [];
  for (const agent of cfg.aiAgents) {
    const { template, relPath } = AGENT_FILES[agent];
    const content = await renderTemplate(template, data);
    files.push({ relPath, content });
  }
  return files;
}
