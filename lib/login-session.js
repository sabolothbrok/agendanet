export function getSessionContinueHref(session) {
  if (!session) return "/";
  if (session.role === "platform_admin") return "/platform";
  if (session.role === "admin" && session.businessSlug) {
    return `/b/${session.businessSlug}/admin`;
  }
  if (session.role === "customer" && session.businessSlug) {
    return `/b/${session.businessSlug}/app`;
  }
  return "/";
}

export function getSessionContinueLabel(session) {
  if (!session) return "Continuar";
  if (session.role === "platform_admin") return "Ir a mis negocios";
  if (session.role === "admin") return "Entrar al panel";
  if (session.role === "customer") return "Entrar a la app";
  return "Continuar";
}

export function getSessionContextLabel(session, businessName) {
  if (!session) return "";
  if (session.role === "platform_admin") return "Administrador general";
  if (session.role === "admin") {
    return businessName ? `Administrador · ${businessName}` : `Administrador · ${session.businessSlug}`;
  }
  if (session.role === "customer") {
    return businessName ? `Cliente · ${businessName}` : `Cliente · ${session.businessSlug}`;
  }
  return "";
}
