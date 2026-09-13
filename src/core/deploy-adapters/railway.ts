import { renderTemplate } from "../template-engine.js";
import type { DeployAdapter, GeneratedFile } from "../types.js";

export const railwayAdapter: DeployAdapter = {
  target: "railway",
  label: "Railway",
  generate: async (): Promise<GeneratedFile[]> => {
    const content = await renderTemplate("deploy/railway/railway.json.hbs", {});
    return [{ relPath: "railway.json", content }];
  },
  nextSteps: () => [
    "railway login",
    "railway init",
    "railway up",
    "railway variables set --from-file .env",
  ],
};
