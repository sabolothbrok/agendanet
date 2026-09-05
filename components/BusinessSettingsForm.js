"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { adminSaveSettings } from "@/app/actions/admin";
import { useToast } from "@/hooks/useToast";
import Spinner from "@/components/Spinner";
import { WEEKDAY_FULL_LABELS, normalizeBusinessTime } from "@/lib/utils";

function Toggle({ name, label, defaultChecked }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg border border-gray-100 px-4 py-3 text-sm dark:border-gray-800">
      <span className="text-gray-700 dark:text-gray-300">{label}</span>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="ui-switch" />
    </label>
  );
}

function seedDays(business, openHour, closeHour) {
  const existing = Array.isArray(business.weeklyHours) ? business.weeklyHours : [];
  return WEEKDAY_FULL_LABELS.map((label, weekday) => {
    const row = existing.find((h) => Number(h.weekday) === weekday);
    return {
      weekday,
      label,
      isOpen: row ? Boolean(row.is_open) : true,
      openHour: normalizeBusinessTime(row?.open_hour || openHour) || "09:00",
      closeHour: normalizeBusinessTime(row?.close_hour || closeHour) || "18:00",
    };
  });
}

export default function BusinessSettingsForm({ slug, business }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const openHour = normalizeBusinessTime(business.open_hour) || "09:00";
  const closeHour = normalizeBusinessTime(business.close_hour) || "18:00";
  const slotMinutes = Number(business.slot_minutes) || 30;
  const [scheduleMode, setScheduleMode] = useState(
    business.use_custom_weekly_hours ? "custom" : "weekly"
  );
  const [days, setDays] = useState(() => seedDays(business, openHour, closeHour));

  const weeklyHint = useMemo(
    () => `${openHour} – ${closeHour}`,
    [openHour, closeHour]
  );

  function updateDay(weekday, patch) {
    setDays((prev) => prev.map((d) => (d.weekday === weekday ? { ...d, ...patch } : d)));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    startTransition(async () => {
      const res = await adminSaveSettings(slug, fd);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Configuración guardada.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-6">
      <div className="card space-y-4 p-4 sm:p-6">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">Horario</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Elige un horario para toda la semana o define cada día. El calendario de admin y
          clientes se ajusta a estas horas.
        </p>

        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm text-gray-600 dark:text-gray-400">Tipo de horario</legend>
          <label className="choice-card flex items-start gap-3 rounded-lg border border-gray-100 px-4 py-3 text-sm dark:border-gray-800">
            <input
              type="radio"
              name="schedule_mode"
              value="weekly"
              checked={scheduleMode === "weekly"}
              onChange={() => setScheduleMode("weekly")}
              className="mt-0.5 h-4 w-4"
            />
            <span>
              <span className="block font-medium text-gray-900 dark:text-gray-100">El mismo horario toda la semana</span>
              <span className="text-gray-500 dark:text-gray-400">Un horario de apertura y cierre para todos los días.</span>
            </span>
          </label>
          <label className="choice-card flex items-start gap-3 rounded-lg border border-gray-100 px-4 py-3 text-sm dark:border-gray-800">
            <input
              type="radio"
              name="schedule_mode"
              value="custom"
              checked={scheduleMode === "custom"}
              onChange={() => setScheduleMode("custom")}
              className="mt-0.5 h-4 w-4"
            />
            <span>
              <span className="block font-medium text-gray-900 dark:text-gray-100">Horario por día</span>
              <span className="text-gray-500 dark:text-gray-400">
                Cada día puede abrir, cerrar o tener horas distintas.
              </span>
            </span>
          </label>
        </fieldset>

        {scheduleMode === "weekly" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">Apertura</label>
              <input
                name="open_hour"
                type="time"
                required
                defaultValue={openHour}
                className="input"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">Cierre</label>
              <input
                name="close_hour"
                type="time"
                required
                defaultValue={closeHour}
                className="input"
              />
            </div>
          </div>
        ) : (
          <>
            <input type="hidden" name="open_hour" value={openHour} />
            <input type="hidden" name="close_hour" value={closeHour} />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Al activar este modo por primera vez, cada día parte de {weeklyHint}. Desmarca un
              día para marcarlo como cerrado.
            </p>
            <div className="space-y-3">
              {days.map((day) => (
                <div
                  key={day.weekday}
                  className="min-w-0 rounded-lg border border-gray-100 p-3 sm:flex sm:items-center sm:gap-3 dark:border-gray-800"
                >
                  <label className="flex min-w-0 items-center gap-2 text-sm font-medium text-gray-900 sm:w-32 sm:shrink-0 dark:text-gray-100">
                    <input
                      type="checkbox"
                      name={`day_${day.weekday}_open`}
                      checked={day.isOpen}
                      onChange={(e) => updateDay(day.weekday, { isOpen: e.target.checked })}
                      className="h-4 w-4 shrink-0"
                    />
                    {day.label}
                  </label>
                  <div
                    className={`mt-2 grid min-w-0 grid-cols-2 gap-x-2 gap-y-1 sm:mt-0 sm:flex-1 ${
                      day.isOpen ? "" : "opacity-50"
                    }`}
                  >
                    <label className="flex min-w-0 flex-col gap-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Apertura</span>
                      <input
                        name={day.isOpen ? `day_${day.weekday}_open_hour` : undefined}
                        type="time"
                        lang="es-CR"
                        required={day.isOpen}
                        disabled={!day.isOpen}
                        value={day.openHour}
                        onChange={(e) => updateDay(day.weekday, { openHour: e.target.value })}
                        className="input input-time"
                      />
                    </label>
                    <label className="flex min-w-0 flex-col gap-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Cierre</span>
                      <input
                        name={day.isOpen ? `day_${day.weekday}_close_hour` : undefined}
                        type="time"
                        lang="es-CR"
                        required={day.isOpen}
                        disabled={!day.isOpen}
                        value={day.closeHour}
                        onChange={(e) => updateDay(day.weekday, { closeHour: e.target.value })}
                        className="input input-time"
                      />
                    </label>
                  </div>
                  {!day.isOpen && (
                    <>
                      <input type="hidden" name={`day_${day.weekday}_open_hour`} value={day.openHour} />
                      <input type="hidden" name={`day_${day.weekday}_close_hour`} value={day.closeHour} />
                    </>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        <div>
          <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">
            Intervalo del calendario (minutos)
          </label>
          <select name="slot_minutes" defaultValue={String(slotMinutes)} className="input">
            <option value="15">15</option>
            <option value="30">30</option>
            <option value="60">60</option>
          </select>
        </div>
      </div>

      <div className="card space-y-4 p-4 sm:p-6">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">Citas</h2>
        <div>
          <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">
            Horas mínimas antes para que el cliente modifique
          </label>
          <input
            name="min_modify_hours"
            type="number"
            defaultValue={business.min_modify_hours}
            className="input"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">
            Duración mínima de cita (minutos)
          </label>
          <input
            name="min_appointment_minutes"
            type="number"
            defaultValue={business.min_appointment_minutes}
            className="input"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Debe ser un múltiplo del intervalo del calendario. Un servicio más largo
            puede ocupar varios intervalos.
          </p>
        </div>
        <Toggle
          name="show_services_list"
          label="Mostrar lista de servicios a clientes"
          defaultChecked={business.show_services_list}
        />
        <Toggle
          name="require_booking_approval"
          label="Aprobar reservas de clientes"
          defaultChecked={Boolean(business.require_booking_approval)}
        />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Si está activo, las reservas quedan pendientes hasta que las apruebes. Varios
          clientes pueden solicitar el mismo horario; al aprobar a uno, los demás ven en
          Mis reservas que el espacio ya no está disponible.
        </p>
      </div>

      <div className="card space-y-3 p-4 sm:p-6">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">Notificaciones (internas)</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Los avisos aparecen en Inicio del panel admin. No se envían SMS ni correo.
        </p>
        <Toggle
          name="notify_new_booking"
          label="Aviso al crear o aprobar reserva"
          defaultChecked={business.notify_new_booking}
        />
        <Toggle
          name="notify_cancel_booking"
          label="Aviso al cancelar o rechazar reserva"
          defaultChecked={business.notify_cancel_booking}
        />
      </div>

      <button type="submit" disabled={isPending} className="btn btn-primary w-full sm:w-auto">
        {isPending && <Spinner />}
        {isPending ? "Guardando..." : "Guardar configuración"}
      </button>
    </form>
  );
}
