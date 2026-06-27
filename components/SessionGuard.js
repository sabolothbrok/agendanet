"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Refresca la página si el navegador restaura una vista cacheada (botón Atrás tras logout). */
export default function SessionGuard() {
  const router = useRouter();

  useEffect(() => {
    function onPageShow(event) {
      if (event.persisted) {
        router.refresh();
      }
    }

    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [router]);

  return null;
}
