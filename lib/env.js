import { loadEnvConfig } from "@next/env";

let localEnvLoaded = false;

function loadLocalEnv() {
  if (localEnvLoaded) return;
  loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
  localEnvLoaded = true;
}

/** Connection string de Neon (local: .env.local · Vercel: Environment Variables). */
export function getDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  loadLocalEnv();
  return process.env.DATABASE_URL || null;
}

/** URL pública para enlaces de invitación y redirects. */
export function getAppUrl() {
  const fromPublic = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromPublic) return fromPublic.replace(/\/$/, "");

  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (productionHost) return `https://${productionHost}`;

  const vercelHost = process.env.VERCEL_URL?.trim();
  if (vercelHost) return `https://${vercelHost}`;

  return "http://localhost:3000";
}

export function missingDatabaseUrlMessage() {
  if (process.env.VERCEL) {
    return (
      "Falta DATABASE_URL en Vercel. En el proyecto: Settings → Environment Variables → " +
      "agrega DATABASE_URL con el connection string de Neon (marca Production, Preview y Development). " +
      "Luego redeploy."
    );
  }

  return (
    "Falta DATABASE_URL en .env.local. Copia .env.local.example, pega tu connection string de Neon " +
    "y reinicia npm run dev."
  );
}
