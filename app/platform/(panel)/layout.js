import { redirect } from "next/navigation";
import SessionGuard from "@/components/SessionGuard";
import { getSession } from "@/lib/session";
import { requirePlatformAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PlatformPanelLayout({ children }) {
  const session = await getSession();
  const auth = await requirePlatformAdminSession(session);

  if (auth.error) {
    redirect("/platform/login?loggedOut=1");
  }

  return (
    <>
      <SessionGuard />
      {children}
    </>
  );
}
