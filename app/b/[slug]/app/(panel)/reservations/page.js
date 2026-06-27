import ReservationsClient from "@/components/ReservationsClient";
import { getSession } from "@/lib/session";
import { requireCustomerSession } from "@/lib/auth";
import { listCustomerAppointments } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ClientReservationsPage({ params }) {
  const { slug } = await params;
  const session = await getSession();
  const auth = await requireCustomerSession(session, slug);
  const appointments = await listCustomerAppointments(
    auth.customer.id,
    auth.business.id
  );

  return (
    <>
      <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">Mis reservas</h1>
      <p className="mt-1 text-sm text-gray-600 sm:text-base">Activas primero, luego historial</p>
      <div className="mt-4 sm:mt-6">
        <ReservationsClient
          slug={slug}
          appointments={appointments}
          business={auth.business}
        />
      </div>
    </>
  );
}
