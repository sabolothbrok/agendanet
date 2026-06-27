"use client";

import { useTransition } from "react";
import { adminSaveSettings } from "@/app/actions/admin";
import { useToast } from "@/hooks/useToast";

function Toggle({ name, label, defaultChecked }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg border border-gray-100 px-4 py-3 text-sm">
      <span className="text-gray-700">{label}</span>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-5 w-5" />
    </label>
  );
}

export default function BusinessSettingsForm({ slug, business }) {
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
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-6">
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
