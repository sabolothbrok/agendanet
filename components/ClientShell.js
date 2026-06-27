"use client";

import { usePathname } from "next/navigation";
import ClientNav from "@/components/ClientNav";

export default function ClientShell({ slug, businessName, customer, children, mainClassName }) {
  const pathname = usePathname();

  return (
    <div className="app-shell min-h-screen overflow-x-clip bg-gray-50">
      <ClientNav
        slug={slug}
        businessName={businessName}
        customerName={customer.name}
        customerPhone={customer.phone}
        isPremium={customer.is_premium}
        current={pathname}
      />
      <main
        className={`page-main mx-auto w-full max-w-5xl min-w-0 overflow-x-clip ${mainClassName || ""}`}
      >
        {children}
      </main>
    </div>
  );
}
