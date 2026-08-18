"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/useToast";

export default function BookedToast() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const shown = useRef(false);

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
  }, [pathname, router, searchParams, toast]);

  return null;
}
