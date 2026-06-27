import PhoneLoginForm from "@/components/PhoneLoginForm";
import { customerLoginAction } from "@/app/actions/auth";
import { getBusinessBySlug } from "@/lib/queries";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ClientLoginPage({ params, searchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  const business = await getBusinessBySlug(slug);
  if (!business) return <p className="p-8">Negocio no encontrado.</p>;

  const session = await getSession();
  const activeSession =
    session?.role === "customer" && session.businessSlug === slug ? session : null;

  const loginBase = `/b/${slug}/app/login`;
  const logoutHref = `/api/auth/clear?redirect=${encodeURIComponent(loginBase)}`;

  return (
    <div className="auth-shell">
      <PhoneLoginForm
        slug={slug}
        action={customerLoginAction}
        title={business.name}
        subtitle="Entra con el teléfono registrado en este negocio."
        businessName={business.name}
        formKey={`${slug}-${sp?.loggedOut || ""}`}
        activeSession={activeSession}
        logoutHref={logoutHref}
        loggedOut={sp?.loggedOut === "1"}
        expired={sp?.expired === "1"}
      />
    </div>
  );
}
