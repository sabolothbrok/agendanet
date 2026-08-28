"use client";

import ErrorFallback from "@/components/ErrorFallback";

export default function Error({ reset }) {
  return <ErrorFallback reset={reset} title="No se pudo cargar la plataforma" />;
}
