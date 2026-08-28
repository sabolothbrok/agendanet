"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { adminApproveAppointment, adminRejectAppointment } from "@/app/actions/admin";
import { useConfirm } from "@/hooks/useConfirm";
import { useToast } from "@/hooks/useToast";
import {
  formatPhone,
  formatTime,
  groupPendingAppointmentsBySlot,
} from "@/lib/utils";

export default function PendingRequestsList({ slug, appointments, onResolved }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { confirm, dialog } = useConfirm();
  const toast = useToast();
  const days = groupPendingAppointmentsBySlot(appointments);

  function refresh() {
    router.refresh();
    onResolved?.();
  }

  async function approve(apt) {
    const others = appointments.filter(
      (a) =>
        a.id !== apt.id &&
        a.space_id === apt.space_id &&
        new Date(a.start_at) < new Date(apt.end_at) &&
        new Date(a.end_at) > new Date(apt.start_at)
    ).length;
    const ok = await confirm({
      title: "Aprobar reserva",
      message:
        others > 0
          ? `¿Aprobar a ${apt.customer_name || apt.customer_phone}? Las otras ${others} solicitud${others === 1 ? "" : "es"} de este espacio y horario se marcarán como no disponibles.`
          : `¿Aprobar la reserva de ${apt.customer_name || apt.customer_phone}?`,
      confirmLabel: "Aprobar",
      cancelLabel: "Volver",
      variant: "primary",
    });
    if (!ok) return;

    startTransition(async () => {
      const res = await adminApproveAppointment(slug, apt.id);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Reserva aprobada.");
      refresh();
    });
  }

  async function reject(apt) {
    const ok = await confirm({
      title: "No confirmar reserva",
      message: `${apt.customer_name || apt.customer_phone} verá en Mis reservas que la solicitud no fue confirmada.`,
      confirmLabel: "No confirmar",
      cancelLabel: "Volver",
    });
    if (!ok) return;

    startTransition(async () => {
      const res = await adminRejectAppointment(slug, apt.id);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Solicitud no confirmada.");
      refresh();
    });
  }

  if (days.length === 0) {
    return (
      <>
        {dialog}
        <p className="mt-4 text-sm text-gray-500">No hay solicitudes pendientes.</p>
      </>
    );
  }

  return (
    <div className={`space-y-6 ${isPending ? "opacity-60" : ""}`}>
      {dialog}
      {days.map((day) => (
        <section key={day.date}>
          <h3 className="text-sm font-semibold capitalize text-gray-900">{day.label}</h3>
          <div className="mt-3 space-y-4">
            {day.slots.map((slot) => (
              <div
                key={slot.key}
                className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 sm:p-4"
              >
                <p className="text-sm font-medium text-gray-900">
                  {formatTime(slot.startAt)} – {formatTime(slot.endAt)} · {slot.spaceName}
                </p>
                <p className="mt-0.5 text-xs text-amber-800">
                  {slot.appointments.length}{" "}
                  {slot.appointments.length === 1 ? "solicitud" : "solicitudes"}
                </p>
                <ul className="mt-3 space-y-2">
                  {slot.appointments.map((apt) => (
                    <li
                      key={apt.id}
                      className="flex flex-col gap-2 rounded-lg border border-white bg-white px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">
                          {apt.customer_name || "Cliente"}
                        </p>
                        <p className="text-gray-500">{formatPhone(apt.customer_phone)}</p>
                        {apt.services?.length > 0 && (
                          <p className="mt-0.5 text-gray-500 break-words">
                            {apt.services.map((s) => s.name).join(", ")}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => approve(apt)}
                          className="btn btn-primary text-xs"
                        >
                          Aprobar
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => reject(apt)}
                          className="btn btn-secondary text-xs"
                        >
                          No confirmar
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
