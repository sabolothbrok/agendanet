import AdminShell from "@/components/AdminShell";
import ServicesClient from "@/components/ServicesClient";
import { getSession } from "@/lib/session";
import { requireAdminSession } from "@/lib/auth";
import { listServices } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage({ params }) {
  const { slug } = await params;
  const session = await getSession();
  const auth = await requireAdminSession(session, slug);
  const services = await listServices(auth.business.id);

  return (
    <AdminShell
      slug={slug}
      businessName={auth.business.name}
      current="/services"
      isPlatformAdmin={auth.isPlatformAdmin}
    >
      <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">Servicios</h1>
      <p className="mt-1 text-sm text-gray-600 sm:text-base">
        Agrega, edita o elimina servicios. La duración calcula automáticamente la cita.
      </p>

      <div className="mt-6">
        <ServicesClient slug={slug} services={services} />
      </div>
    </AdminShell>
  );
}
