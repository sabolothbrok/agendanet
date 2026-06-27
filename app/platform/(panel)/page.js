import Link from "next/link";
import PlatformShell from "@/components/PlatformShell";
import { getSession } from "@/lib/session";
import { listBusinessesByPlatformAdmin } from "@/lib/queries";
import { formatPhone } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PlatformHomePage() {
  const session = await getSession();
  const businesses = await listBusinessesByPlatformAdmin(session.userId);

  return (
    <PlatformShell adminName={session.name} current="/">
      <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">Mis negocios</h1>
      <p className="mt-1 text-sm text-gray-600 sm:text-base">
        Crea negocios y entra a administrar cada uno.
      </p>

      <div className="mt-6">
        <Link href="/platform/businesses/new" className="btn btn-primary w-full sm:w-auto">
          Nuevo negocio
        </Link>
      </div>

      {businesses.length === 0 ? (
        <div className="card mt-6 p-8 text-center text-gray-500">
          Aún no tienes negocios. Crea el primero con el botón de arriba.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {businesses.map((b) => (
            <div key={b.id} className="card p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                {b.business_type_label || b.business_type}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-gray-900">{b.name}</h2>
              <p className="mt-2 text-sm text-gray-600">
                Admin: {b.admin_name} · {formatPhone(b.admin_phone)}
              </p>
              <p className="mt-1 text-xs text-gray-500">/{b.slug}</p>
              <Link
                href={`/b/${b.slug}/admin`}
                className="btn btn-primary mt-4 w-full text-center text-sm sm:w-auto"
              >
                Administrar
              </Link>
            </div>
          ))}
        </div>
      )}
    </PlatformShell>
  );
}
