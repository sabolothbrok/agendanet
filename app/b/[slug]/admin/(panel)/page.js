import AdminShell from "@/components/AdminShell";
import { getSession } from "@/lib/session";
import { requireAdminSession } from "@/lib/auth";
import { getTodayAppointments, listNotifications } from "@/lib/queries";
import { adminMarkRead } from "@/app/actions/admin";
import { formatTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminHomePage({ params }) {
  const { slug } = await params;
  const session = await getSession();
  const auth = await requireAdminSession(session, slug);
  const { business, session: s, isPlatformAdmin, adminUserId } = auth;

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
      <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">Inicio</h1>
      <p className="mt-1 text-sm text-gray-600 sm:text-base">Citas de hoy y notificaciones</p>

      <div className="mt-6 grid gap-4 sm:gap-6 lg:grid-cols-2">
        <section className="card p-4 sm:p-6">
          <h2 className="font-semibold text-gray-900">Citas de hoy</h2>
          {appointments.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">No hay citas para hoy.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {appointments.map((apt) => (
                <li
                  key={apt.id}
                  className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm"
                >
                  <p className="font-medium text-gray-900">
                    {formatTime(apt.start_at)} – {apt.customer_name}
                  </p>
                  <p className="text-gray-500">
                    {apt.space_name} · {apt.customer_phone}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-4 sm:p-6">
          <h2 className="flex flex-wrap items-center gap-2 font-semibold text-gray-900">
            Notificaciones
            {unread.length > 0 && (
              <span className="badge badge-warning">{unread.length} nuevas</span>
            )}
          </h2>
          {notifications.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">Sin notificaciones.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {notifications.slice(0, 10).map((n) => (
                <li
                  key={n.id}
                  className={`rounded-lg border px-4 py-3 text-sm ${
                    n.read_at ? "border-gray-100 opacity-70" : "border-gray-200 bg-white"
                  }`}
                >
                  <p className="font-medium text-gray-900">{n.title}</p>
                  <p className="text-gray-600">{n.body}</p>
                  {!n.read_at && (
                    <form action={adminMarkRead.bind(null, slug)} className="mt-2">
                      <input type="hidden" name="notificationId" value={n.id} />
                      <button type="submit" className="text-xs text-gray-500 hover:underline">
                        Marcar leída
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
