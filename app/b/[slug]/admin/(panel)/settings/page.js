import AdminShell from "@/components/AdminShell";
import BusinessSettingsForm from "@/components/BusinessSettingsForm";
import SpacesSettings from "@/components/SpacesSettings";
import { getSession } from "@/lib/session";
import { requireAdminSession } from "@/lib/auth";
import { listSpaces } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({ params }) {
  const { slug } = await params;
  const session = await getSession();
  const auth = await requireAdminSession(session, slug);
  const b = auth.business;
  const spaces = await listSpaces(b.id);

  return (
    <AdminShell
      slug={slug}
      businessName={b.name}
      current="/settings"
      isPlatformAdmin={auth.isPlatformAdmin}
    >
      <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">Configuración</h1>
      <p className="mt-1 text-sm text-gray-600 sm:text-base">
        Estaciones, reglas de citas y notificaciones internas
      </p>

      <div className="mt-6 max-w-xl">
        <SpacesSettings slug={slug} spaces={spaces} />
      </div>

      <BusinessSettingsForm slug={slug} business={b} />
    </AdminShell>
  );
}
