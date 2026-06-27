import BookingClient from "@/components/BookingClient";
import BookedToast from "@/components/BookedToast";
import { Suspense } from "react";
import { getSession } from "@/lib/session";
import { requireCustomerSession } from "@/lib/auth";
import { getCalendarData, listServices } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ClientHomePage({ params, searchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  const session = await getSession();
  const auth = await requireCustomerSession(session, slug);
  const { business, customer } = auth;

  const date = sp?.date || new Date().toISOString().slice(0, 10);
  const [calendarData, allServices] = await Promise.all([
    getCalendarData(business.id, date, { viewerCustomerId: customer.id }),
    listServices(business.id, { activeOnly: true }),
  ]);

  const services = allServices.filter(
    (s) => !s.is_premium || customer.is_premium
  );

  return (
    <>
      <Suspense fallback={null}>
        <BookedToast />
      </Suspense>
      <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">Reservar cita</h1>
      <p className="mt-1 text-sm text-gray-600 sm:text-base">
        Elige un espacio disponible en el calendario
      </p>
      <div className="mt-6">
        <BookingClient
          slug={slug}
          business={business}
          date={date}
          calendarData={calendarData}
          services={services}
          customerId={customer.id}
        />
      </div>
    </>
  );
}
