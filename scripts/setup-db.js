/**
 * Applies db/schema.sql to Neon. DESTRUCTIVE — drops all tables.
 * Usage: ALLOW_DB_RESET=1 npm run db:setup
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
  if (process.env.ALLOW_DB_RESET !== "1") {
    console.error("db:setup borra TODOS los datos de DATABASE_URL.");
    console.error("Para una base existente usa: npm run db:migrate");
    console.error("Para resetear de verdad: ALLOW_DB_RESET=1 npm run db:setup");
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("Missing DATABASE_URL in .env.local");
    process.exit(1);
  }

  const dbDir = join(__dirname, "..", "db");
  const reset = readFileSync(join(dbDir, "reset.sql"), "utf8");
  const schema = readFileSync(join(dbDir, "schema.sql"), "utf8");
  const migrateFiles = readdirSync(dbDir)
    .filter((f) => f.startsWith("migrate-") && f.endsWith(".sql"))
    .sort();
  const pool = new Pool({ connectionString });

  try {
    console.log("Reseteando tablas...");
    await pool.query(reset);
    console.log("Aplicando esquema...");
    await pool.query(schema);
    for (const file of migrateFiles) {
      await pool.query(
        "INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING",
        [file]
      );
    }
    const { rows } = await pool.query(
      "SELECT slug, name FROM businesses ORDER BY name"
    );
    console.log("Schema aplicado.");
    rows.forEach((r) => console.log(`  · ${r.name} (${r.slug})`));
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
