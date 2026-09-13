import crypto from "node:crypto";
import type { DbCredentials, Secrets } from "./types.js";
import { toDbIdentifier } from "../utils/slugify.js";

function randomBase64(bytes = 16): string {
  return crypto.randomBytes(bytes).toString("base64");
}

function randomAlphanumeric(length = 20): string {
  return crypto
    .randomBytes(length)
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, length);
}

/** Matches the shape Strapi's own scaffolder generates (4x APP_KEYS, base64 salts/secrets). */
export function generateSecrets(): Secrets {
  return {
    appKeys: [randomBase64(), randomBase64(), randomBase64(), randomBase64()],
    apiTokenSalt: randomBase64(),
    adminJwtSecret: randomBase64(),
    jwtSecret: randomBase64(),
    transferTokenSalt: randomBase64(),
    encryptionKey: randomBase64(),
  };
}

export function generateDbCredentials(projectName: string): DbCredentials {
  return {
    dbName: toDbIdentifier(projectName),
    dbUser: `strapi_${randomAlphanumeric(8).toLowerCase()}`,
    dbPassword: randomAlphanumeric(24),
    dbRootPassword: randomAlphanumeric(24),
  };
}
