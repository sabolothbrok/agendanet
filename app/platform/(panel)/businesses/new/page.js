import PlatformShell from "@/components/PlatformShell";
import CreateBusinessForm from "@/components/CreateBusinessForm";
import { getSession } from "@/lib/session";
import { listBusinessTypes } from "@/lib/queries";

export default async function NewBusinessPage() {
  const session = await getSession();
  const businessTypes = await listBusinessTypes();

  return (
    <PlatformShell adminName={session.name} current="/businesses/new">
      <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">Nuevo negocio</h1>
      <p className="mt-1 text-sm text-gray-600 sm:text-base">
        Configura el negocio y su administrador local.
      </p>

      <div className="mt-6">
        <CreateBusinessForm businessTypes={businessTypes} />
      </div>
    </PlatformShell>
  );
}
