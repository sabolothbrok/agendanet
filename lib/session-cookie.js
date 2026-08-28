import { createHmac, timingSafeEqual } from "crypto";

function getSessionSecret() {
  const explicit = process.env.SESSION_SECRET?.trim();
  if (explicit) return explicit;
  const material = process.env.DATABASE_URL || "agendanet-local";
  return createHmac("sha256", "agendanet.session.v1").update(material).digest("hex");
}

export function encodeSessionCookie(session) {
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  const sig = createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
  return `v1.${payload}.${sig}`;
}

export function decodeSessionCookie(raw) {
  if (!raw || typeof raw !== "string") return null;
  const parts = raw.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return null;

  const payload = parts[1];
  const sig = parts[2];
  const expected = createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}
