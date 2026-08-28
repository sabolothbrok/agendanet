import { getSql } from "./db";

const MAX_ATTEMPTS = 8;

export async function consumeAuthAttempt(key) {
  try {
    const sql = getSql();
    await sql`DELETE FROM auth_attempts WHERE attempted_at < NOW() - INTERVAL '15 minutes'`;
    const [{ count }] = await sql`
      SELECT COUNT(*)::int AS count
      FROM auth_attempts
      WHERE key = ${key} AND attempted_at > NOW() - INTERVAL '15 minutes'
    `;
    if (count >= MAX_ATTEMPTS) return false;
    await sql`INSERT INTO auth_attempts (key) VALUES (${key})`;
    return true;
  } catch (error) {
    console.error("consumeAuthAttempt", error);
    return true;
  }
}

export const AUTH_ATTEMPT_ERROR =
  "No se pudo iniciar sesión con ese teléfono. Revisa el número o espera unos minutos.";
