import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { requirePlatformAdminSession } from "@/lib/auth";

export default async function PlatformPanelLayout({ children }) {
  const session = await getSession();
  const auth = await requirePlatformAdminSession(session);

  if (auth.error) {
    redirect("/platform/login");
  }

  return children;
}
