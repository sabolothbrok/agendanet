import PlatformShell from "@/components/PlatformShell";
import PlatformSettingsForm from "@/components/PlatformSettingsForm";
import BusinessTypesSettings from "@/components/BusinessTypesSettings";
import { getSession } from "@/lib/session";
import { getPlatformAdminById, listBusinessTypes } from "@/lib/queries";

export default async function PlatformSettingsPage() {
  const session = await getSession();
  const [profile, businessTypes] = await Promise.all([
    getPlatformAdminById(session.userId),
    listBusinessTypes(),
  ]);

  return (
    <PlatformShell adminName={session.name} current="/settings">
      <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">Configuración</h1>
      <p className="mt-1 text-sm text-gray-600 sm:text-base">
        Perfil y tipos de negocio disponibles al crear nuevos negocios.
      </p>

      <div className="mt-6 space-y-6">
        <PlatformSettingsForm profile={profile} />
        <BusinessTypesSettings types={businessTypes} />
      </div>
    </PlatformShell>
  );
}
