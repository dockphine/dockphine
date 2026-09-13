import { renderTemplate } from "../template-engine.js";
import type { DeployAdapter, GeneratedFile, ProjectConfig } from "../types.js";

export const flyAdapter: DeployAdapter = {
  target: "fly",
  label: "Fly.io",
  generate: async (cfg: ProjectConfig): Promise<GeneratedFile[]> => {
    const content = await renderTemplate("deploy/fly/fly.toml.hbs", {
      projectName: cfg.projectName,
      port: cfg.port,
      dbEngine: cfg.dbEngine,
    });
    return [{ relPath: "fly.toml", content }];
  },
  nextSteps: () => [
    "fly launch --no-deploy",
    "fly secrets import < .env",
    "fly deploy",
  ],
};
