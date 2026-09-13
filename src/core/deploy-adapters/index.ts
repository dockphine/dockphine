import {
  awsAdapter,
  contaboAdapter,
  digitalOceanAdapter,
  genericVpsAdapter,
  hetznerAdapter,
} from "./vps.js";
import { flyAdapter } from "./fly.js";
import { railwayAdapter } from "./railway.js";
import { renderAdapter } from "./render.js";
import { dokployAdapter } from "./dokploy.js";
import type { DeployAdapter, DeployTarget } from "../types.js";

export const deployAdapters: Record<DeployTarget, DeployAdapter> = {
  digitalocean: digitalOceanAdapter,
  hetzner: hetznerAdapter,
  aws: awsAdapter,
  contabo: contaboAdapter,
  vps: genericVpsAdapter,
  fly: flyAdapter,
  railway: railwayAdapter,
  render: renderAdapter,
  dokploy: dokployAdapter,
};
