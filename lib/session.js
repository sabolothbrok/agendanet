import { cookies } from "next/headers";
import { SESSION_COOKIE } from "./auth-cookie";
import {
  getSessionCookieMaxAge,
  getSessionCookieOptions,
  getSessionExpiryState,
  SESSION_ABSOLUTE_MAX_SECONDS,
  touchSessionTimestamps,
  withSessionTimestamps,
} from "./session-policy";

export { SESSION_COOKIE };

export async function getSession({ touch = false } = {}) {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  let session;
  try {
    session = JSON.parse(raw);
  } catch {
    return null;
  }

  const expiry = getSessionExpiryState(session);
  if (expiry.expired) {
    await clearSession();
    return null;
  }

  if (!touch) return session;

  const touched = touchSessionTimestamps(session);
  store.set(
    SESSION_COOKIE,
    JSON.stringify(touched),
    getSessionCookieOptions(getSessionCookieMaxAge(touched))
  );
  return touched;
}

export async function setSession(session) {
  const store = await cookies();
  const payload = session.createdAt ? session : withSessionTimestamps(session);
  store.set(
    SESSION_COOKIE,
    JSON.stringify(payload),
    getSessionCookieOptions(SESSION_ABSOLUTE_MAX_SECONDS)
  );
}

export async function clearSession() {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", getSessionCookieOptions(0));
  store.delete(SESSION_COOKIE);
}
