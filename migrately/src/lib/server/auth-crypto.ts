import "server-only";

import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

const PASSWORD_KEY_LENGTH = 64;

export function hashPassword(password: string, salt?: string) {
  const nextSalt = salt ?? randomBytes(16).toString("hex");
  const hash = scryptSync(password, nextSalt, PASSWORD_KEY_LENGTH).toString(
    "hex"
  );

  return `${nextSalt}:${hash}`;
}

export function verifyPassword(password: string, storedValue: string) {
  const [salt, storedHash] = storedValue.split(":");

  if (!salt || !storedHash) {
    return false;
  }

  const derivedHash = Buffer.from(
    scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString("hex"),
    "hex"
  );
  const existingHash = Buffer.from(storedHash, "hex");

  if (derivedHash.length !== existingHash.length) {
    return false;
  }

  return timingSafeEqual(derivedHash, existingHash);
}

export function createSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
