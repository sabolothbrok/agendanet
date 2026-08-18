"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { adminSaveSettings } from "@/app/actions/admin";
import { useToast } from "@/hooks/useToast";
import { normalizeBusinessTime } from "@/lib/utils";

function Toggle({ name, label, defaultChecked }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg border border-gray-100 px-4 py-3 text-sm">
      <span className="text-gray-700">{label}</span>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-5 w-5" />
    </label>
  );
}

export default function BusinessSettingsForm({ slug, business }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

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

  const openHour = normalizeBusinessTime(business.open_hour) || "09:00";
  const closeHour = normalizeBusinessTime(business.close_hour) || "18:00";
  const slotMinutes = Number(business.slot_minutes) || 30;

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-6">
      <div className="card space-y-4 p-4 sm:p-6">
        <h2 className="font-semibold text-gray-900">Horario</h2>
        <p className="text-sm text-gray-600">
          Define el horario de atención. El calendario de admin y clientes se ajusta a estas horas.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-gray-600">Apertura</label>
            <input
              name="open_hour"
              type="time"
              required
              defaultValue={openHour}
              className="input"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600">Cierre</label>
            <input
              name="close_hour"
              type="time"
              required
              defaultValue={closeHour}
              className="input"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-600">
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
        <h2 className="font-semibold text-gray-900">Citas</h2>
        <div>
          <label className="mb-1 block text-sm text-gray-600">
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
          <label className="mb-1 block text-sm text-gray-600">
            Duración mínima de cita (minutos)
          </label>
          <input
            name="min_appointment_minutes"
            type="number"
            defaultValue={business.min_appointment_minutes}
            className="input"
          />
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
        <p className="text-sm text-gray-500">
          Si está activo, las reservas quedan pendientes hasta que las apruebes. Varios
          clientes pueden solicitar el mismo horario; al aprobar a uno, los demás reciben
          aviso de que el espacio ya no está disponible.
        </p>
      </div>

      <div className="card space-y-3 p-4 sm:p-6">
        <h2 className="font-semibold text-gray-900">Notificaciones (internas)</h2>
        <Toggle
          name="reminders_enabled"
          label="Recordatorios de cita para clientes"
          defaultChecked={business.reminders_enabled}
        />
        <Toggle
          name="notify_new_booking"
          label="Aviso al crear reserva"
          defaultChecked={business.notify_new_booking}
        />
        <Toggle
          name="notify_cancel_booking"
          label="Aviso al cancelar reserva"
          defaultChecked={business.notify_cancel_booking}
        />
        <Toggle
          name="notify_inactive_enabled"
          label="Aviso si cliente lleva tiempo sin cita"
          defaultChecked={business.notify_inactive_enabled}
        />
        <div>
          <label className="mb-1 block text-sm text-gray-600">Días sin cita para avisar</label>
          <input
            name="notify_inactive_days"
            type="number"
            defaultValue={business.notify_inactive_days}
            className="input"
          />
        </div>
      </div>

      <button type="submit" disabled={isPending} className="btn btn-primary w-full sm:w-auto">
        {isPending ? "Guardando..." : "Guardar configuración"}
      </button>
    </form>
  );
}
