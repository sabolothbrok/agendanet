"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Evita scroll horizontal residual al entrar en una ruta (Safari iOS). */
export default function ScrollReset() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollLeft = 0;
    document.body.scrollLeft = 0;
  }, [pathname]);

  return null;
}
