"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Captures loggedOut/expired from the initial render (server-provided via
 * the URL) and then strips them from the URL, so a refresh or share of the
 * link doesn't keep re-showing "sesión cerrada" / re-carry a stale query string.
 */
export function useCleanLoginUrl(loggedOut, expired) {
  const [notice] = useState(() => ({ loggedOut: Boolean(loggedOut), expired: Boolean(expired) }));
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!notice.loggedOut) return;
    router.replace(pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return notice;
}
