import AdminCalendarClient from "@/components/AdminCalendarClient";
import { getSession } from "@/lib/session";
import { requireAdminSession } from "@/lib/auth";
import { getCalendarData } from "@/lib/queries";
import { todayDateInputStr } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Calendario" };

export default async function AdminCalendarPage({ params, searchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  const session = await getSession();
  const auth = await requireAdminSession(session, slug);
  const { business } = auth;

  const date = sp?.date || todayDateInputStr();
  const calendarData = await getCalendarData(business.id, date, { includePending: true });

  return (
    <>
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 sm:text-2xl">Calendario</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 sm:text-base">
        Gestiona disponibilidad de espacios y reservas
      </p>
      <div className="mt-6">
        <AdminCalendarClient
          slug={slug}
          business={business}
          date={date}
          calendarData={calendarData}
        />
      </div>
    </>
  );
}
