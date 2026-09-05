import { redirect } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import SessionGuard from "@/components/SessionGuard";
import { getSession } from "@/lib/session";
import { requireAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({ children, params }) {
  const { slug } = await params;
  const session = await getSession();
  const auth = await requireAdminSession(session, slug);

  if (auth.error) {
    if (session?.role === "platform_admin") {
      redirect("/platform");
    }
    redirect(`/b/${slug}/admin/login?loggedOut=1`);
  }

  return (
    <AdminShell
      slug={slug}
      businessName={auth.business.name}
      isPlatformAdmin={auth.isPlatformAdmin}
    >
      <SessionGuard />
      {children}
    </AdminShell>
  );
}
