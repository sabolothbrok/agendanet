import PhoneLoginForm from "@/components/PhoneLoginForm";
import { adminLoginAction } from "@/app/actions/auth";
import { getBusinessBySlug } from "@/lib/queries";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({ params, searchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  const business = await getBusinessBySlug(slug);
  if (!business) return <p className="p-8">Negocio no encontrado.</p>;

  const session = await getSession();
  const activeSession =
    session?.role === "admin" && session.businessSlug === slug ? session : null;

  const loginBase = `/b/${slug}/admin/login`;
  const logoutHref = `/api/auth/clear?redirect=${encodeURIComponent(loginBase)}`;

  return (
    <div className="auth-shell">
      <PhoneLoginForm
        slug={slug}
        action={adminLoginAction}
        title={`Admin · ${business.name}`}
        subtitle="Ingresa con tu teléfono de administrador."
        businessName={business.name}
        formKey={`admin-${slug}-${sp?.loggedOut || ""}`}
        activeSession={activeSession}
        logoutHref={logoutHref}
        loggedOut={sp?.loggedOut === "1"}
        expired={sp?.expired === "1"}
      />
    </div>
  );
}
