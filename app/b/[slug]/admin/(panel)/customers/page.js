import AdminShell from "@/components/AdminShell";
import CustomersClient from "@/components/CustomersClient";
import { getSession } from "@/lib/session";
import { requireAdminSession } from "@/lib/auth";
import { listCustomers } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage({ params }) {
  const { slug } = await params;
  const session = await getSession();
  const auth = await requireAdminSession(session, slug);
  const customers = await listCustomers(auth.business.id);

  return (
    <AdminShell
      slug={slug}
      businessName={auth.business.name}
      current="/customers"
      isPlatformAdmin={auth.isPlatformAdmin}
    >
      <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">Clientes</h1>
      <p className="mt-1 text-sm text-gray-600 sm:text-base">
        Lista, invitaciones y acceso premium
      </p>
      <div className="mt-6">
        <CustomersClient slug={slug} customers={customers} />
      </div>
    </AdminShell>
  );
}
