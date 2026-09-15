export type Mode = "new" | "existing";

export type StrapiVersion = "v4" | "v5";

export type DbEngine = "sqlite" | "postgres" | "mysql";

export type DeployTarget =
  | "digitalocean"
  | "hetzner"
  | "aws"
  | "contabo"
  | "vps"
  | "fly"
  | "railway"
  | "render"
  | "dokploy"
  | "none";

export const VPS_FAMILY_TARGETS: readonly DeployTarget[] = [
  "digitalocean",
  "hetzner",
  "aws",
  "contabo",
  "vps",
];

export type BuildMode = "build-now" | "scaffold-only";

export type AiAgent =
  | "claude"
  | "cursor"
  | "copilot"
  | "windsurf"
  | "codex"
  | "gemini"
  | "generic";

export interface DbCredentials {
  dbName: string;
  dbUser: string;
  dbPassword: string;
  dbRootPassword: string;
}

export interface Secrets {
  appKeys: string[];
  apiTokenSalt: string;
  adminJwtSecret: string;
  jwtSecret: string;
  transferTokenSalt: string;
  encryptionKey: string;
}

export interface ProjectConfig {
  mode: Mode;
  projectName: string;
  projectDir: string;
  strapiVersion: StrapiVersion;
  dbEngine: DbEngine;
  dbCredentials: DbCredentials;
  port: number;
  deployTarget: DeployTarget;
  buildMode: BuildMode;
  useAI: boolean;
  aiAgents: AiAgent[];
  secrets: Secrets;
  exampleSecrets: Secrets;
}

export interface GeneratedFile {
  /** Path relative to the project directory. */
  relPath: string;
  content: string;
}

export interface DeployAdapter {
  target: DeployTarget;
  label: string;
  generate: (cfg: ProjectConfig) => Promise<GeneratedFile[]>;
  /** Printed as the final "next step" command for this target. */
  nextSteps: (cfg: ProjectConfig) => string[];
}
