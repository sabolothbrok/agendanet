import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

export const PASSWORD_MIN_LENGTH = 8;

export function isPasswordStrongEnough(password) {
  return typeof password === "string" && password.length >= PASSWORD_MIN_LENGTH;
}

/** Hashes a password as "salt:hash" (both hex). No external dependency needed. */
export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scryptAsync(password, salt, KEY_LENGTH);
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password, storedHash) {
  if (!password || !storedHash) return false;
  const [salt, hashHex] = String(storedHash).split(":");
  if (!salt || !hashHex) return false;

  const derived = await scryptAsync(password, salt, KEY_LENGTH);
  const storedBuffer = Buffer.from(hashHex, "hex");
  if (storedBuffer.length !== derived.length) return false;
  return timingSafeEqual(storedBuffer, derived);
}
