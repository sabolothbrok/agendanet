/**
 * Applies additive SQL in db/migrate-*.sql without dropping data.
 * Usage: npm run db:migrate
 */
const { readFileSync, existsSync, readdirSync } = require("fs");
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

  const dbDir = join(__dirname, "..", "db");
  const files = readdirSync(dbDir)
    .filter((f) => f.startsWith("migrate-") && f.endsWith(".sql"))
    .sort();

  const pool = new Pool({ connectionString });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const { rows: appliedRows } = await pool.query(
      "SELECT filename FROM schema_migrations"
    );
    const applied = new Set(appliedRows.map((r) => r.filename));

    if (applied.size === 0) {
      const { rows: existing } = await pool.query(
        "SELECT to_regclass('public.appointments') AS t"
      );
      if (existing[0]?.t) {
        for (const file of files) {
          if (file === "migrate-integrity.sql") continue;
          await pool.query(
            "INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING",
            [file]
          );
          applied.add(file);
        }
      }
    }

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`Omitiendo ${file} (ya aplicada)`);
        continue;
      }
      console.log(`Aplicando ${file}...`);
      await pool.query(readFileSync(join(dbDir, file), "utf8"));
      await pool.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [file]);
    }
    console.log("Migraciones aplicadas.");
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
