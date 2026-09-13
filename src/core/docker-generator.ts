import { renderTemplate } from "./template-engine.js";
import type { GeneratedFile, ProjectConfig } from "./types.js";
import { DB_SERVICE_HOST } from "./env-writer.js";

export async function generateDockerFiles(cfg: ProjectConfig): Promise<GeneratedFile[]> {
  const data = {
    projectName: cfg.projectName,
    port: cfg.port,
    dbEngine: cfg.dbEngine,
    dbHost: DB_SERVICE_HOST,
    dbName: cfg.dbCredentials.dbName,
    dbUser: cfg.dbCredentials.dbUser,
    dbPassword: cfg.dbCredentials.dbPassword,
    dbRootPassword: cfg.dbCredentials.dbRootPassword,
  };

  const dockerfileTemplate = cfg.strapiVersion === "v5" ? "dockerfile/v5.hbs" : "dockerfile/v4.hbs";

  const [dockerfile, compose, dockerignore] = await Promise.all([
    renderTemplate(dockerfileTemplate, data),
    renderTemplate("compose/docker-compose.hbs", data),
    renderTemplate("dockerignore.hbs", data),
  ]);

  return [
    { relPath: "Dockerfile", content: dockerfile },
    { relPath: "docker-compose.yml", content: compose },
    { relPath: ".dockerignore", content: dockerignore },
  ];
}
