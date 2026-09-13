import fs from "fs-extra";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src = path.join(rootDir, "templates");
const dest = path.join(rootDir, "dist", "templates");

await fs.copy(src, dest);
console.log(`Copied templates/ -> dist/templates/`);
