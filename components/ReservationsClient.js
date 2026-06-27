"use client";

import { useState, useTransition } from "react";
import { customerCancel } from "@/app/actions/customer";
import { formatDateShort, formatTime, getAppointmentStatusLabel } from "@/lib/utils";
import { useConfirm } from "@/hooks/useConfirm";
import { useToast } from "@/hooks/useToast";

export default function ReservationsClient({ slug, appointments, business }) {
  const [items, setItems] = useState(appointments);
  const [isPending, startTransition] = useTransition();
  const { confirm, dialog } = useConfirm();
  const toast = useToast();

  const now = new Date();
  const active = items.filter(
    (a) => a.status === "active" && new Date(a.start_at) >= now
  );
  const history = items.filter(
    (a) => a.status !== "active" || new Date(a.start_at) < now
  );

  async function cancel(id) {
    const ok = await confirm({
      title: "Cancelar reserva",
      message: "¿Seguro que quieres cancelar esta reserva?",
      confirmLabel: "Sí, cancelar",
      cancelLabel: "Volver",
    });
    if (!ok) return;
    startTransition(async () => {
      const res = await customerCancel(slug, id);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      setItems((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status: "cancelled", cancelled_by: "customer" } : a
        )
      );
      toast.success("Reserva cancelada.");
    });
  }

  function Card({ apt, showActions }) {
    return (
      <li className="card p-4 text-sm">
        <div className="flex justify-between gap-4">
          <div>
            <p className="font-medium text-gray-900">{formatDateShort(apt.start_at)}</p>
            <p className="text-gray-600">
              {formatTime(apt.start_at)} – {formatTime(apt.end_at)} · {apt.space_name}
            </p>
            {apt.services?.length > 0 && (
              <p className="mt-1 text-gray-500">
                {apt.services.map((s) => s.name).join(", ")}
              </p>
            )}
          </div>
          <span
            className={`badge h-fit ${
              apt.status === "active" ? "badge-success" : "badge-neutral"
            }`}
          >
            {getAppointmentStatusLabel(apt)}
          </span>
        </div>
        {showActions && apt.status === "active" && (
          <button
            type="button"
            onClick={() => cancel(apt.id)}
            disabled={isPending}
            className="btn btn-danger mt-3 text-xs"
          >
            Cancelar
          </button>
        )}
      </li>
    );
  }

  return (
    <div className={`space-y-8 ${isPending ? "opacity-60" : ""}`}>
      {dialog}
      <section>
        <h2 className="font-semibold text-gray-900">Activas</h2>
        {active.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">No tienes reservas activas.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {active.map((apt) => (
              <Card key={apt.id} apt={apt} showActions />
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2 className="font-semibold text-gray-900">Historial</h2>
        {history.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">Sin historial.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {history.map((apt) => (
              <Card key={apt.id} apt={apt} showActions={false} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
