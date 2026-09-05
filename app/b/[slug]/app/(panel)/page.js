import BookingClient from "@/components/BookingClient";
import BookedToast from "@/components/BookedToast";
import { Suspense } from "react";
import { getSession } from "@/lib/session";
import { requireCustomerSession } from "@/lib/auth";
import { getCalendarData, listServices } from "@/lib/queries";
import { todayDateInputStr } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reservar" };

export default async function ClientHomePage({ params, searchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  const session = await getSession();
  const auth = await requireCustomerSession(session, slug);
  const { business, customer } = auth;

  const today = todayDateInputStr();
  const requested = sp?.date || today;
  const date = requested < today ? today : requested;
  const [calendarData, allServices] = await Promise.all([
    getCalendarData(business.id, date, { viewerCustomerId: customer.id }),
    listServices(business.id, { activeOnly: true }),
  ]);

  const services = allServices.filter(
    (s) => !s.is_premium || customer.is_premium
  );

  return (
    <div className="min-w-0 max-w-full">
      <Suspense fallback={null}>
        <BookedToast />
      </Suspense>
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 sm:text-2xl">Reservar cita</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 sm:text-base">
        {business.require_booking_approval
          ? "Elige un espacio. Tu reserva quedará pendiente hasta que el negocio la apruebe."
          : "Elige un espacio disponible en el calendario"}
      </p>
      <div className="mt-4 min-w-0 sm:mt-6">
        <BookingClient
          slug={slug}
          business={business}
          date={date}
          calendarData={calendarData}
          services={services}
          customerId={customer.id}
        />
      </div>
    </div>
  );
}
