import PhoneLoginForm from "@/components/PhoneLoginForm";
import { platformLoginAction } from "@/app/actions/auth";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function PlatformLoginPage({ searchParams }) {
  const sp = await searchParams;
  const session = await getSession();
  const activeSession = session?.role === "platform_admin" ? session : null;
  const logoutHref = `/api/auth/clear?redirect=${encodeURIComponent("/platform/login")}`;

  return (
    <div className="auth-shell">
      <PhoneLoginForm
        action={platformLoginAction}
        title="Admin general"
        subtitle="Gestiona tus negocios y crea nuevos desde aquí."
        formKey={`platform-${sp?.loggedOut || ""}`}
        activeSession={activeSession}
        logoutHref={logoutHref}
        loggedOut={sp?.loggedOut === "1"}
        expired={sp?.expired === "1"}
      />
    </div>
  );
}
