import UniversalLoginForm from "@/components/UniversalLoginForm";
import { universalLoginAction } from "@/app/actions/auth";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }) {
  const sp = await searchParams;
  const session = await getSession();
  const logoutHref = `/api/auth/clear?redirect=${encodeURIComponent("/login")}`;

  return (
    <div className="auth-shell">
      <UniversalLoginForm
        action={universalLoginAction}
        formKey={`login-${sp?.loggedOut || ""}`}
        activeSession={session}
        logoutHref={logoutHref}
        loggedOut={sp?.loggedOut === "1"}
        expired={sp?.expired === "1"}
      />
    </div>
  );
}
