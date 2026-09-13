import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node18",
  clean: true,
  splitting: false,
  sourcemap: false,
  banner: {
    js: "#!/usr/bin/env node",
  },
  external: [
    "chalk",
    "cli-progress",
    "commander",
    "execa",
    "fs-extra",
    "handlebars",
    "inquirer",
    "ora",
  ],
});
