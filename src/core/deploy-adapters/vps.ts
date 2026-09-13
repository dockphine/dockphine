import { renderTemplate } from "../template-engine.js";
import type { DeployAdapter, DeployTarget, GeneratedFile, ProjectConfig } from "../types.js";

const LABELS: Record<string, string> = {
  digitalocean: "DigitalOcean Droplet",
  hetzner: "Hetzner Cloud",
  aws: "AWS (EC2 / Lightsail)",
  contabo: "Contabo",
  vps: "Generic VPS",
};

function makeVpsAdapter(target: DeployTarget): DeployAdapter {
  const providerLabel = LABELS[target];
  return {
    target,
    label: providerLabel,
    generate: async (cfg: ProjectConfig): Promise<GeneratedFile[]> => {
      const data = {
        projectName: cfg.projectName,
        port: cfg.port,
        providerLabel,
      };
      const [caddyfile, compose, deployScript] = await Promise.all([
        renderTemplate("deploy/vps/Caddyfile.hbs", data),
        renderTemplate("deploy/vps/docker-compose.vps.hbs", data),
        renderTemplate("deploy/vps/deploy.sh.hbs", data),
      ]);
      return [
        { relPath: "Caddyfile", content: caddyfile },
        { relPath: "docker-compose.vps.yml", content: compose },
        { relPath: "deploy.sh", content: deployScript },
      ];
    },
    nextSteps: () => [
      `chmod +x deploy.sh`,
      `./deploy.sh user@your-${target === "vps" ? "server" : target}-ip`,
    ],
  };
}

export const digitalOceanAdapter = makeVpsAdapter("digitalocean");
export const hetznerAdapter = makeVpsAdapter("hetzner");
export const awsAdapter = makeVpsAdapter("aws");
export const contaboAdapter = makeVpsAdapter("contabo");
export const genericVpsAdapter = makeVpsAdapter("vps");
