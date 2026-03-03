import crypto from "crypto";
import { env } from "./env";

const ALGO = "aes-256-gcm";

function keyFromEnv() {
  const raw = env.APP_ENCRYPTION_KEY;
  const maybeB64 = Buffer.from(raw, "base64");
  if (maybeB64.length === 32 && maybeB64.toString("base64") === raw) {
    return maybeB64;
  }
  return crypto.createHash("sha256").update(raw).digest();
}

export function encryptSecret(value: string): string {
  const key = keyFromEnv();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptSecret(payload: string): string {
  const decoded = Buffer.from(payload, "base64");
  const iv = decoded.subarray(0, 12);
  const tag = decoded.subarray(12, 28);
  const data = decoded.subarray(28);
  const key = keyFromEnv();
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
