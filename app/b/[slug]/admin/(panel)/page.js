import { BellOff, CalendarX2 } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import MarkNotificationButton from "@/components/MarkNotificationButton";
import PendingRequestsList from "@/components/PendingRequestsList";
import { getSession } from "@/lib/session";
import { requireAdminSession } from "@/lib/auth";
import { getTodayAppointments, listNotifications, listPendingAppointments } from "@/lib/queries";
import { formatDate, formatTime, todayDateInputStr } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Panel" };

export default async function AdminHomePage({ params }) {
  const { slug } = await params;
  const session = await getSession();
  const auth = await requireAdminSession(session, slug);
  const { business, adminUserId } = auth;

  const [appointments, notifications, pending] = await Promise.all([
    getTodayAppointments(business.id),
    adminUserId
      ? listNotifications("admin", adminUserId, business.id)
      : Promise.resolve([]),
    listPendingAppointments(business.id),
  ]);

  const unread = notifications.filter((n) => !n.read_at);
  const showPendingInbox = Boolean(business.require_booking_approval) || pending.length > 0;
  const todayLabel = formatDate(todayDateInputStr());

  return (
    <>
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 sm:text-2xl">Inicio</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 sm:text-base">
        {showPendingInbox
          ? "Solicitudes pendientes, agenda del día y notificaciones"
          : "Agenda del día y notificaciones"}
      </p>

      {showPendingInbox && (
        <section className="card mt-6 p-4 sm:p-6">
          <h2 className="flex flex-wrap items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
            Solicitudes pendientes
            {pending.length > 0 && (
              <span className="badge badge-warning">{pending.length}</span>
            )}
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Agrupadas por día, hora y espacio. Al aprobar a una persona, las demás de ese
            horario reciben aviso de que el espacio no está disponible.
          </p>
          <div className="mt-4">
            <PendingRequestsList slug={slug} appointments={pending} />
          </div>
        </section>
      )}

      <div className="mt-6 grid gap-4 sm:gap-6 lg:grid-cols-2">
        <section className="card p-4 sm:p-6">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Agenda de hoy</h2>
          <p className="mt-0.5 text-sm capitalize text-gray-500 dark:text-gray-400">{todayLabel}</p>
          {appointments.length === 0 ? (
            <EmptyState
              icon={CalendarX2}
              description="No hay citas confirmadas para hoy. Las reservas de otros días aparecen en Calendario o en Solicitudes pendientes."
            />
          ) : (
            <ul className="mt-4 space-y-3">
              {appointments.map((apt) => (
                <li
                  key={apt.id}
                  className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm dark:border-gray-800 dark:bg-gray-800"
                >
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {formatTime(apt.start_at)} – {apt.customer_name}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">
                    {apt.space_name} · {apt.customer_phone}
                  </p>
                  {apt.services?.length > 0 && (
                    <p className="mt-0.5 text-gray-500 dark:text-gray-400 break-words">
                      {apt.services.map((s) => s.name).join(", ")}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-4 sm:p-6">
          <h2 className="flex flex-wrap items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
            Notificaciones
            {unread.length > 0 && (
              <span className="badge badge-warning">{unread.length} nuevas</span>
            )}
          </h2>
          {notifications.length === 0 ? (
            <EmptyState icon={BellOff} description="Sin notificaciones." />
          ) : (
            <ul className="mt-4 space-y-3">
              {notifications.slice(0, 10).map((n) => (
                <li
                  key={n.id}
                  className={`rounded-lg border px-4 py-3 text-sm ${
                    n.read_at ? "border-gray-100 opacity-70 dark:border-gray-800" : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                  }`}
                >
                  <p className="font-medium break-words text-gray-900 dark:text-gray-100">{n.title}</p>
                  <p className="break-words text-gray-600 dark:text-gray-400">{n.body}</p>
                  {!n.read_at && (
                    <div className="mt-2">
                      <MarkNotificationButton slug={slug} notificationId={n.id} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
