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
  const { business } = auth;

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
          label: `${report.totalAppointments === 1 ? "cita" : "citas"} en la semana`,
        },
        {
          icon: XCircle,
          value: String(report.cancelledCount),
          label: "cancelaciones",
        },
      ]
    : [];

  return (
    <>
      <div className="flex items-start gap-3">
        <span className="icon-badge h-10 w-10 shrink-0 rounded-xl">
          <BarChart3 className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 sm:text-2xl">Reporte semanal</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 sm:text-base">
            Ocupación de estaciones y actividad del {report?.weekLabel || "periodo actual"}
          </p>
        </div>
      </div>

      {!report || report.spaceCount === 0 ? (
        <div className="card mt-6 p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Configura al menos una estación activa para ver el reporte de ocupación.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6">
            <WeeklyReportChart
              eyebrow="Ocupación por día"
              title="Estaciones en la semana"
              description={
                business.use_custom_weekly_hours
                  ? `Basado en ${report.spaceCount} estación${report.spaceCount === 1 ? "" : "es"} activa${report.spaceCount === 1 ? "" : "s"} y el horario de cada día.`
                  : `Basado en ${report.spaceCount} estación${report.spaceCount === 1 ? "" : "es"} activa${report.spaceCount === 1 ? "" : "s"} y horario ${String(business.open_hour).slice(0, 5)}–${String(business.close_hour).slice(0, 5)}.`
              }
              days={report.days}
              peak={report.peak}
              kpis={kpis}
              footnote="La ocupación une minutos reservados por estación (citas activas y completadas; no incluye pendientes) contra la capacidad del día, en zona de Costa Rica."
            />
          </div>

          <section className="card mt-6 p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Detalle por día</h2>

            <ul className="mt-4 space-y-2 md:hidden">
              {report.days.map((day) => (
                <li
                  key={day.date}
                  className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm dark:border-gray-800 dark:bg-gray-800"
                >
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {day.label}
                    <span className="mt-0.5 block text-xs font-normal text-gray-500 dark:text-gray-400">
                      {formatDateShort(day.date)}
                    </span>
                  </p>
                  <p className="mt-1 text-gray-600 dark:text-gray-400">
                    {day.value}% ocupación · {day.appointmentCount} cita
                    {day.appointmentCount === 1 ? "" : "s"} · {day.bookedMinutes} min
                  </p>
                </li>
              ))}
            </ul>

            <div className="table-scroll mt-4 hidden md:block">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="border-y border-gray-100 bg-gray-50 text-left dark:border-gray-800 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600 sm:px-6 dark:text-gray-400">Día</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Ocupación</th>
                  <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Citas</th>
                  <th className="px-4 py-3 font-medium text-gray-600 sm:pr-6 dark:text-gray-400">Minutos reservados</th>
                </tr>
              </thead>
              <tbody>
                {report.days.map((day) => (
                  <tr key={day.date} className="border-b border-gray-100 last:border-0 dark:border-gray-800">
                    <td className="px-4 py-3 font-medium text-gray-900 sm:px-6 dark:text-gray-100">
                      {day.label}
                      <span className="mt-0.5 block text-xs font-normal text-gray-500 dark:text-gray-400">
                        {formatDateShort(day.date)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{day.value}%</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{day.appointmentCount}</td>
                    <td className="px-4 py-3 text-gray-700 sm:pr-6 dark:text-gray-300">{day.bookedMinutes} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}
