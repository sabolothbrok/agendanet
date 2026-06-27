import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { requireAdminSession } from "@/lib/auth";

export default async function AdminPanelLayout({ children, params }) {
  const { slug } = await params;
  const session = await getSession();
  const auth = await requireAdminSession(session, slug);

  if (auth.error) {
    if (session?.role === "platform_admin") {
      redirect("/platform");
    }
    redirect(`/b/${slug}/admin/login`);
  }

  return children;
}
