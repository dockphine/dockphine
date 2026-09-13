import { run } from "./cli.js";

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
