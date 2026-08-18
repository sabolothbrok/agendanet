/**
 * Applies additive SQL in db/migrate-approval.sql without dropping data.
 * Usage: npm run db:migrate
 */
const { readFileSync, existsSync } = require("fs");
const { join } = require("path");
const { Pool } = require("@neondatabase/serverless");

function loadEnv() {
  const envPath = join(__dirname, "..", ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i === -1) continue;
    let v = trimmed.slice(i + 1).trim();
    if ((v[0] === '"' && v.endsWith('"')) || (v[0] === "'" && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[trimmed.slice(0, i).trim()] = v;
  }
}

loadEnv();

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("Missing DATABASE_URL in .env.local");
    process.exit(1);
  }

  const sql = readFileSync(join(__dirname, "..", "db", "migrate-approval.sql"), "utf8");
  const pool = new Pool({ connectionString });

  try {
    console.log("Aplicando migración de aprobación de reservas...");
    await pool.query(sql);
    const { rows } = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'business_settings' AND column_name = 'require_booking_approval'
    `);
    if (!rows.length) {
      throw new Error("La columna require_booking_approval no se creó.");
    }
    console.log("Migración aplicada.");
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
