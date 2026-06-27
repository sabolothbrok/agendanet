"use client";

import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/useToast";

/** Muestra logout/expired como toast (un solo mensaje; el siguiente lo reemplaza). */
export default function LoginStatusToast({ loggedOut, expired, activeSession }) {
  const toast = useToast();
  const shownRef = useRef(false);

  useEffect(() => {
    if (activeSession || shownRef.current) return;
    if (expired) {
      shownRef.current = true;
      toast.info("Tu sesión expiró por inactividad. Inicia sesión de nuevo.");
    } else if (loggedOut) {
      shownRef.current = true;
      toast.success("Sesión cerrada correctamente.");
    }
  }, [activeSession, expired, loggedOut, toast]);

  return null;
}
