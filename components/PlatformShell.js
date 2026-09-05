"use client";

import { usePathname } from "next/navigation";
import PlatformNav from "@/components/PlatformNav";

export default function PlatformShell({ adminName, children }) {
  const pathname = usePathname();
  const base = "/platform";
  const current = pathname.startsWith(base) ? pathname.slice(base.length) || "/" : pathname;

  return (
    <div className="app-shell min-h-screen w-full min-w-0 overflow-x-clip md:flex">
      <PlatformNav adminName={adminName} current={current} />
      <main className="page-main min-w-0 w-full max-w-full flex-1 overflow-x-clip">{children}</main>
    </div>
  );
}
