/** Tiempo máximo de sesión aunque haya actividad (7 días). */
export const SESSION_ABSOLUTE_MAX_SECONDS = 7 * 24 * 60 * 60;

/** Inactividad antes de cerrar sesión, por rol (segundos). */
export const SESSION_INACTIVITY_SECONDS = {
  customer: 24 * 60 * 60,
  admin: 8 * 60 * 60,
  platform_admin: 8 * 60 * 60,
};

export function getSessionInactivitySeconds(role) {
  return SESSION_INACTIVITY_SECONDS[role] ?? SESSION_INACTIVITY_SECONDS.admin;
}

export function withSessionTimestamps(session) {
  const now = Date.now();
  return {
    ...session,
    createdAt: session.createdAt ?? now,
    lastActivityAt: now,
  };
}

export function touchSessionTimestamps(session) {
  return { ...session, lastActivityAt: Date.now() };
}

export function getSessionExpiryState(session, now = Date.now()) {
  if (!session) return { expired: true, reason: "missing" };

  const createdAt = Number(session.createdAt) || 0;
  const lastActivityAt = Number(session.lastActivityAt) || createdAt;

  if (!session.createdAt && !session.lastActivityAt) {
    return { expired: false, reason: null };
  }

  if (!createdAt) {
    return { expired: true, reason: "invalid" };
  }

  if (now - createdAt > SESSION_ABSOLUTE_MAX_SECONDS * 1000) {
    return { expired: true, reason: "absolute" };
  }

  const idleLimitMs = getSessionInactivitySeconds(session.role) * 1000;
  if (now - lastActivityAt > idleLimitMs) {
    return { expired: true, reason: "inactivity" };
  }

  return { expired: false, reason: null };
}

export function getSessionCookieMaxAge(session, now = Date.now()) {
  const createdAt = Number(session.createdAt) || now;
  const remainingAbsolute = Math.ceil(
    (createdAt + SESSION_ABSOLUTE_MAX_SECONDS * 1000 - now) / 1000
  );
  return Math.max(remainingAbsolute, 0);
}

export function getSessionCookieOptions(maxAgeSeconds) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
