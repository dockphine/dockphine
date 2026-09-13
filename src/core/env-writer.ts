import fs from "fs-extra";
import path from "node:path";
import { renderTemplate } from "./template-engine.js";
import { parseDotenv } from "../utils/dotenv.js";
import type { ProjectConfig, Secrets } from "./types.js";

/** Docker-compose service hostname the Strapi container connects to for non-sqlite engines. */
export const DB_SERVICE_HOST = "db";

function buildEnvData(cfg: ProjectConfig, secrets: Secrets, isExample: boolean) {
  return {
    isExample,
    port: cfg.port,
    appKeys: secrets.appKeys.join(","),
    apiTokenSalt: secrets.apiTokenSalt,
    adminJwtSecret: secrets.adminJwtSecret,
    jwtSecret: secrets.jwtSecret,
    transferTokenSalt: secrets.transferTokenSalt,
    encryptionKey: secrets.encryptionKey,
    dbEngine: cfg.dbEngine,
    dbHost: cfg.dbEngine === "sqlite" ? "" : DB_SERVICE_HOST,
    dbPort: cfg.dbEngine === "postgres" ? 5432 : cfg.dbEngine === "mysql" ? 3306 : "",
    dbName: cfg.dbCredentials.dbName,
    dbUser: cfg.dbCredentials.dbUser,
    dbPassword: cfg.dbCredentials.dbPassword,
  };
}

/**
 * Preserve secrets already present in an existing .env (Existing Project mode) rather than
 * silently rotating them, since that could invalidate live admin sessions / API tokens.
 * DATABASE_* always gets overridden to match the docker-compose service we generate.
 */
function mergeWithExisting(existing: Record<string, string>, fallback: Secrets): Secrets {
  const appKeys = existing.APP_KEYS ? existing.APP_KEYS.split(",") : fallback.appKeys;
  return {
    appKeys: appKeys.length > 0 ? appKeys : fallback.appKeys,
    apiTokenSalt: existing.API_TOKEN_SALT || fallback.apiTokenSalt,
    adminJwtSecret: existing.ADMIN_JWT_SECRET || fallback.adminJwtSecret,
    jwtSecret: existing.JWT_SECRET || fallback.jwtSecret,
    transferTokenSalt: existing.TRANSFER_TOKEN_SALT || fallback.transferTokenSalt,
    encryptionKey: existing.ENCRYPTION_KEY || fallback.encryptionKey,
  };
}

export async function writeEnvFiles(cfg: ProjectConfig): Promise<void> {
  const envPath = path.join(cfg.projectDir, ".env");
  const envExamplePath = path.join(cfg.projectDir, ".env.example");

  let secrets = cfg.secrets;
  if (cfg.mode === "existing" && (await fs.pathExists(envPath))) {
    const existing = parseDotenv(await fs.readFile(envPath, "utf-8"));
    secrets = mergeWithExisting(existing, cfg.secrets);
  }

  const envContent = await renderTemplate("env.hbs", buildEnvData(cfg, secrets, false));
  await fs.ensureDir(cfg.projectDir);
  await fs.writeFile(envPath, envContent, "utf-8");

  const shouldWriteExample = cfg.mode === "new" || !(await fs.pathExists(envExamplePath));
  if (shouldWriteExample) {
    const exampleContent = await renderTemplate(
      "env.hbs",
      buildEnvData(cfg, cfg.exampleSecrets, true)
    );
    await fs.writeFile(envExamplePath, exampleContent, "utf-8");
  }
}
