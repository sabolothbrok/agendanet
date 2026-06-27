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
    if (shown.current || searchParams.get("booked") !== "1") return;
    shown.current = true;
    toast.success("Reserva confirmada.");
    router.replace(pathname, { scroll: false });
  }, [pathname, router, searchParams, toast]);

  return null;
}
