import PhoneLoginForm from "@/components/PhoneLoginForm";
import { adminLoginAction } from "@/app/actions/auth";
import { getBusinessBySlug } from "@/lib/queries";

export default async function AdminLoginPage({ params }) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) return <p className="p-8">Negocio no encontrado.</p>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <PhoneLoginForm
        slug={slug}
        action={adminLoginAction}
        title={`Admin · ${business.name}`}
        subtitle="Ingresa con tu teléfono de administrador."
      />
    </div>
  );
}
