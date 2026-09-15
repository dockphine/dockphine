import type { DeployAdapter, GeneratedFile } from "../types.js";

export const noneAdapter: DeployAdapter = {
  target: "none",
  label: "No deploy target selected",
  generate: async (): Promise<GeneratedFile[]> => [],
  nextSteps: () => [],
};
