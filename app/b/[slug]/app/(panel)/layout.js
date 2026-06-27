import { redirect } from "next/navigation";
import ClientShell from "@/components/ClientShell";
import SessionGuard from "@/components/SessionGuard";
import { getSession } from "@/lib/session";
import { requireCustomerSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ClientPanelLayout({ children, params }) {
  const { slug } = await params;
  const session = await getSession();
  const auth = await requireCustomerSession(session, slug);

  if (auth.error) {
    redirect(`/b/${slug}/app/login?loggedOut=1`);
  }

  return (
    <ClientShell
      slug={slug}
      businessName={auth.business.name}
      customer={auth.customer}
    >
      <SessionGuard />
      {children}
    </ClientShell>
  );
}
