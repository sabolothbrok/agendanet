"use client";

import { usePathname } from "next/navigation";
import ClientNav from "@/components/ClientNav";

export default function ClientShell({ slug, businessName, customer, children, mainClassName }) {
  const pathname = usePathname();

  return (
    <div className="client-page min-h-screen bg-gray-50">
      <ClientNav
        slug={slug}
        businessName={businessName}
        customerName={customer.name}
        customerPhone={customer.phone}
        isPremium={customer.is_premium}
        current={pathname}
      />
      <main className={mainClassName || "mx-auto max-w-5xl px-4 py-6 sm:py-8"}>
        {children}
      </main>
    </div>
  );
}
