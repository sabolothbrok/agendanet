import { neon } from "@neondatabase/serverless";

export function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Falta DATABASE_URL en .env.local");
  }
  return neon(connectionString);
}
