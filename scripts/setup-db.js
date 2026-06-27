/**
 * Applies db/schema.sql to Neon.
 * Usage: npm run db:setup
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

  const reset = readFileSync(join(__dirname, "..", "db", "reset.sql"), "utf8");
  const schema = readFileSync(join(__dirname, "..", "db", "schema.sql"), "utf8");
  const pool = new Pool({ connectionString });

  try {
    console.log("Reseteando tablas...");
    await pool.query(reset);
    console.log("Aplicando esquema...");
    await pool.query(schema);
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
