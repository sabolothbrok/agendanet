"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import ScrollReset from "@/components/ScrollReset";
import AdminNav from "@/components/AdminNav";
import CommandPalette from "@/components/CommandPalette";

export default function AdminShell({ slug, businessName, isPlatformAdmin, children }) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const base = `/b/${slug}/admin`;
  const current = pathname.startsWith(base) ? pathname.slice(base.length) : pathname;

  return (
    <div className="app-shell min-h-screen w-full max-w-full min-w-0 overflow-x-hidden md:flex">
      <ScrollReset />
      <CommandPalette slug={slug} open={searchOpen} setOpen={setSearchOpen} />
      <AdminNav
        slug={slug}
        businessName={businessName}
        current={current}
        isPlatformAdmin={isPlatformAdmin}
        onOpenSearch={() => setSearchOpen(true)}
      />
      <main className="page-main min-w-0 w-full max-w-full flex-1 overflow-x-hidden">
        {isPlatformAdmin && (
          <div className="surface-warning mb-4 rounded-lg px-4 py-3 text-sm">
            Estás administrando este negocio como{" "}
            <span className="font-medium">admin general</span>.
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
