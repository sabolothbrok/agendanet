import AdminShell from "@/components/AdminShell";
import MarkNotificationButton from "@/components/MarkNotificationButton";
import { getSession } from "@/lib/session";
import { requireAdminSession } from "@/lib/auth";
import { getTodayAppointments, listNotifications } from "@/lib/queries";
import { formatPhone, formatTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminHomePage({ params }) {
  const { slug } = await params;
  const session = await getSession();
  const auth = await requireAdminSession(session, slug);
  const { business, isPlatformAdmin, adminUserId } = auth;

  const [appointments, notifications] = await Promise.all([
    getTodayAppointments(business.id),
    adminUserId
      ? listNotifications("admin", adminUserId, business.id)
      : Promise.resolve([]),
  ]);

  const unread = notifications.filter((n) => !n.read_at);

  return (
    <AdminShell
      slug={slug}
      businessName={business.name}
      current=""
      isPlatformAdmin={isPlatformAdmin}
    >
      <div className="min-w-0 max-w-full">
        <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">Inicio</h1>
        <p className="mt-1 text-sm text-gray-600 sm:text-base">Citas de hoy y notificaciones</p>

        <div className="mt-6 grid min-w-0 grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          <section className="card min-w-0 p-4 sm:p-6">
            <h2 className="font-semibold text-gray-900">Citas de hoy</h2>
            {appointments.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">No hay citas para hoy.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {appointments.map((apt) => (
                  <li
                    key={apt.id}
                    className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-3 text-sm sm:px-4"
                  >
                    <p className="font-medium break-words text-gray-900">
                      {formatTime(apt.start_at)} – {apt.customer_name}
                    </p>
                    <p className="mt-0.5 break-words text-gray-500">
                      {apt.space_name} · {formatPhone(apt.customer_phone)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card min-w-0 p-4 sm:p-6">
            <h2 className="flex flex-wrap items-center gap-2 font-semibold text-gray-900">
              Notificaciones
              {unread.length > 0 && (
                <span className="badge badge-warning shrink-0">{unread.length} nuevas</span>
              )}
            </h2>
            {notifications.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">Sin notificaciones.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {notifications.slice(0, 10).map((n) => (
                  <li
                    key={n.id}
                    className={`min-w-0 rounded-lg border px-3 py-3 text-sm sm:px-4 ${
                      n.read_at ? "border-gray-100 opacity-70" : "border-gray-200 bg-white"
                    }`}
                  >
                    <p className="font-medium break-words text-gray-900">{n.title}</p>
                    <p className="mt-0.5 break-words text-gray-600">{n.body}</p>
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
      </div>
    </AdminShell>
  );
}
