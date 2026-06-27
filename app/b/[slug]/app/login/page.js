import PhoneLoginForm from "@/components/PhoneLoginForm";
import { customerLoginAction } from "@/app/actions/auth";
import { getBusinessBySlug } from "@/lib/queries";

export default async function ClientLoginPage({ params }) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) return <p className="p-8">Negocio no encontrado.</p>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <PhoneLoginForm
        slug={slug}
        action={customerLoginAction}
        title={business.name}
        subtitle="Entra con el teléfono que registraste mediante invitación."
      />
    </div>
  );
}
