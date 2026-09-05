"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Check } from "lucide-react";
import { useToast } from "@/hooks/useToast";

export default function BookedToast() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const shown = useRef(false);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    const booked = searchParams.get("booked");
    if (shown.current || (booked !== "1" && booked !== "pending")) return;
    shown.current = true;
    toast.success(
      booked === "pending"
        ? "Solicitud enviada. El negocio debe aprobarla."
        : "Reserva confirmada."
    );
    router.replace(pathname, { scroll: false });

    if (booked !== "1") return;
    const showTimeout = window.setTimeout(() => setCelebrate(true), 0);
    const hideTimeout = window.setTimeout(() => setCelebrate(false), 1200);
    return () => {
      window.clearTimeout(showTimeout);
      window.clearTimeout(hideTimeout);
    };
  }, [pathname, router, searchParams, toast]);

  return (
    <AnimatePresence>
      {celebrate && (
        <motion.div
          className="booking-success-overlay"
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="booking-success-badge"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 20 }}
          >
            <Check className="h-8 w-8" strokeWidth={3} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
