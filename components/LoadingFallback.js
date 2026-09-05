"use client";

import { motion } from "motion/react";

function Bar({ className }) {
  return <div className={`skeleton-block ${className || ""}`} />;
}

export default function LoadingFallback({ label = "Cargando…" }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Bar className="skeleton-title" />
        <Bar className="skeleton-subtitle" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Bar className="skeleton-card" />
          <Bar className="skeleton-card" />
        </div>
      </motion.div>
    </div>
  );
}
