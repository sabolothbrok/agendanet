import { neon } from "@neondatabase/serverless";
import { getDatabaseUrl, missingDatabaseUrlMessage } from "./env";

export function getSql() {
  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    throw new Error(missingDatabaseUrlMessage());
  }
  return neon(connectionString);
}
