import { renderTemplate } from "../template-engine.js";
import type { DeployAdapter, GeneratedFile, ProjectConfig } from "../types.js";

export const dokployAdapter: DeployAdapter = {
  target: "dokploy",
  label: "Dokploy",
  generate: async (cfg: ProjectConfig): Promise<GeneratedFile[]> => {
    const content = await renderTemplate("deploy/dokploy/docker-compose.dokploy.hbs", {
      projectName: cfg.projectName,
      port: cfg.port,
    });
    return [{ relPath: "docker-compose.dokploy.yml", content }];
  },
  nextSteps: () => [
    "Push this repo to a git remote Dokploy can access",
    "In Dokploy: create a Compose application, point it at this repo, use docker-compose.dokploy.yml",
    "Set the secret env vars from your .env in the Dokploy dashboard",
  ],
};
