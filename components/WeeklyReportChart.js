const CHART_HEIGHT_PX = 104;

export default function WeeklyReportChart({
  eyebrow,
  title,
  description,
  days,
  peak,
  kpis = [],
  footnote,
  variant = "admin",
}) {
  const peakDay = peak || days.reduce((best, d) => (d.value > best.value ? d : best), days[0]);
  const outerClass =
    variant === "landing"
      ? "w-full max-w-[34rem] mx-auto lg:max-w-none lg:mx-0"
      : "w-full";
  const panelClass =
    variant === "landing"
      ? "flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_40px_rgb(15_23_42_/_0.07)] sm:gap-5 sm:p-6"
      : "card flex flex-col gap-4 p-4 sm:gap-5 sm:p-6";

  return (
    <div className={outerClass}>
      <div className={panelClass}>
        {(eyebrow || title || description) && (
          <div className="space-y-2">
            {eyebrow && (
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-slate-500">
                {eyebrow}
              </p>
            )}
            {title && (
              <p className="text-lg font-bold leading-snug tracking-tight text-gray-900 sm:text-xl">
                {title}
              </p>
            )}
            {description && (
              <p className="text-[0.8125rem] leading-relaxed text-gray-600 sm:text-sm">
                {description}
              </p>
            )}
          </div>
        )}

        {days.length === 0 ? (
          <p className="text-sm text-gray-500">No hay datos para mostrar.</p>
        ) : (
          <>
            <div
              className="grid grid-cols-7 gap-1 border-t border-gray-100 pt-4"
              role="img"
              aria-label="Gráfico de ocupación semanal por día"
            >
              {days.map((d) => {
                const barHeight = Math.round((d.value / 100) * CHART_HEIGHT_PX);
                const isPeak = d.label === peakDay.label && d.date === peakDay.date;

                return (
                  <div key={`${d.label}-${d.date}`} className="flex min-w-0 flex-col items-center gap-1.5">
                    <div className="flex h-[6.5rem] w-full items-end px-0.5">
                      <div
                        className={`w-full min-h-[4px] rounded-t-md ${isPeak ? "bg-gray-900" : "bg-gray-300"}`}
                        style={{ height: `${Math.max(barHeight, d.value > 0 ? 4 : 0)}px` }}
                      />
                    </div>
                    <span className="text-[0.6875rem] font-semibold text-gray-500">{d.label}</span>
                    <span className="text-[0.625rem] font-medium text-gray-400">{d.value}%</span>
                  </div>
                );
              })}
            </div>

            <p className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-xs text-gray-600">
              Pico de la semana:{" "}
              <strong className="font-semibold text-gray-900">{peakDay.label}</strong> con{" "}
              {peakDay.value}% de ocupación
              {peakDay.appointmentCount != null && peakDay.appointmentCount > 0 && (
                <> · {peakDay.appointmentCount} citas</>
              )}
            </p>
          </>
        )}

        {kpis.length > 0 && (
          <div className="grid gap-2.5 sm:grid-cols-3">
            {kpis.map(({ icon: Icon, value, label }) => (
              <div
                key={label}
                className="flex items-start gap-2.5 rounded-xl border border-gray-200 bg-gray-50 p-3"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-900">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-[0.9375rem] font-bold leading-none tracking-tight text-gray-900">
                    {value}
                  </p>
                  <p className="mt-1 text-[0.625rem] leading-snug text-gray-500">{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {footnote && <p className="text-[0.6875rem] leading-relaxed text-gray-400">{footnote}</p>}
      </div>
    </div>
  );
}
