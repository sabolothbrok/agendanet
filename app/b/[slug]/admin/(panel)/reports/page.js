import AdminShell from "@/components/AdminShell";
import WeeklyReportChart from "@/components/WeeklyReportChart";
import { getSession } from "@/lib/session";
import { requireAdminSession } from "@/lib/auth";
import { getWeeklyReport } from "@/lib/queries";
import { formatDateShort } from "@/lib/utils";
import { BarChart3, CalendarCheck, TrendingUp, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage({ params }) {
  const { slug } = await params;
  const session = await getSession();
  const auth = await requireAdminSession(session, slug);
  const { business, isPlatformAdmin } = auth;

  const report = await getWeeklyReport(business.id);

  const kpis = report
    ? [
        {
          icon: TrendingUp,
          value: `${report.avgOccupancy}%`,
          label: "ocupación promedio",
        },
        {
          icon: CalendarCheck,
          value: String(report.totalAppointments),
          label: "citas en la semana",
        },
        {
          icon: XCircle,
          value: String(report.cancelledCount),
          label: "cancelaciones",
        },
      ]
    : [];

  return (
    <AdminShell
      slug={slug}
      businessName={business.name}
      current="/reports"
      isPlatformAdmin={isPlatformAdmin}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white">
          <BarChart3 className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">Reporte semanal</h1>
          <p className="mt-1 text-sm text-gray-600 sm:text-base">
            Ocupación de estaciones y actividad del {report?.weekLabel || "periodo actual"}
          </p>
        </div>
      </div>

      {!report || report.spaceCount === 0 ? (
        <div className="card mt-6 p-6">
          <p className="text-sm text-gray-600">
            Configura al menos una estación activa para ver el reporte de ocupación.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6">
            <WeeklyReportChart
              eyebrow="Ocupación por día"
              title="Estaciones en la semana"
              description={`Basado en ${report.spaceCount} estación${report.spaceCount === 1 ? "" : "es"} activa${report.spaceCount === 1 ? "" : "s"} y horario ${String(business.open_hour).slice(0, 5)}–${String(business.close_hour).slice(0, 5)}.`}
              days={report.days}
              peak={report.peak}
              kpis={kpis}
              footnote="La ocupación compara minutos reservados (citas activas y completadas) contra la capacidad total del día."
            />
          </div>

          <section className="card mt-6 overflow-x-auto">
            <h2 className="px-4 pt-4 text-sm font-semibold text-gray-900 sm:px-6 sm:pt-6">
              Detalle por día
            </h2>
            <table className="mt-4 w-full min-w-[480px] text-sm">
              <thead className="border-y border-gray-100 bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600 sm:px-6">Día</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Ocupación</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Citas</th>
                  <th className="px-4 py-3 font-medium text-gray-600 sm:pr-6">Minutos reservados</th>
                </tr>
              </thead>
              <tbody>
                {report.days.map((day) => (
                  <tr key={day.date} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-gray-900 sm:px-6">
                      {day.label}
                      <span className="mt-0.5 block text-xs font-normal text-gray-500">
                        {formatDateShort(day.date)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{day.value}%</td>
                    <td className="px-4 py-3 text-gray-700">{day.appointmentCount}</td>
                    <td className="px-4 py-3 text-gray-700 sm:pr-6">{day.bookedMinutes} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </AdminShell>
  );
}
