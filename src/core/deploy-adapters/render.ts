import { renderTemplate } from "../template-engine.js";
import type { DeployAdapter, GeneratedFile, ProjectConfig } from "../types.js";

export const renderAdapter: DeployAdapter = {
  target: "render",
  label: "Render",
  generate: async (cfg: ProjectConfig): Promise<GeneratedFile[]> => {
    const content = await renderTemplate("deploy/render/render.yaml.hbs", {
      projectName: cfg.projectName,
      port: cfg.port,
      dbEngine: cfg.dbEngine,
    });
    return [{ relPath: "render.yaml", content }];
  },
  nextSteps: () => [
    "Push this repo to GitHub/GitLab",
    "Create a new Blueprint on Render pointing at render.yaml",
    "Set the secret env vars (APP_KEYS, JWT_SECRET, etc.) from your .env in the Render dashboard",
  ],
};
