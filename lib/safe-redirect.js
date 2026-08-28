/** Only same-origin relative paths. Rejects protocol-relative and absolute URLs. */
export function safeRedirectPath(value, fallback = "/") {
  const raw = String(value || "").trim();
  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//") || raw.includes("\\")) return fallback;
  if (raw.includes("://")) return fallback;
  return raw;
}
