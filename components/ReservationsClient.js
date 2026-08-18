"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { customerCancel } from "@/app/actions/customer";
import {
  formatDateShort,
  formatTime,
  getAppointmentStatusDetail,
  getAppointmentStatusLabel,
} from "@/lib/utils";
import { useConfirm } from "@/hooks/useConfirm";
import { useToast } from "@/hooks/useToast";
import { CLIENT_HISTORY_LIMIT } from "@/lib/constants";

export default function ReservationsClient({ slug, appointments, business }) {
  const [items, setItems] = useState(appointments);
  const [isPending, startTransition] = useTransition();
  const { confirm, dialog } = useConfirm();
  const toast = useToast();

  const now = new Date();
  const pending = items.filter(
    (a) => a.status === "pending" && new Date(a.start_at) >= now
  );
  const active = items.filter(
    (a) => a.status === "active" && new Date(a.start_at) >= now
  );
  const allHistory = items
    .filter(
      (a) =>
        !["pending", "active"].includes(a.status) || new Date(a.start_at) < now
    )
    .sort((a, b) => new Date(b.start_at) - new Date(a.start_at));
  const history = allHistory.slice(0, CLIENT_HISTORY_LIMIT);
  const historyTruncated = allHistory.length > CLIENT_HISTORY_LIMIT;

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
    const statusDetail = getAppointmentStatusDetail(apt);

    return (
      <li className="card p-4 text-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <p className="font-medium text-gray-900">{formatDateShort(apt.start_at)}</p>
            <p className="text-gray-600 break-words">
              {formatTime(apt.start_at)} – {formatTime(apt.end_at)} · {apt.space_name}
            </p>
            {apt.services?.length > 0 && (
              <p className="mt-1 text-gray-500 break-words">
                {apt.services.map((s) => s.name).join(", ")}
              </p>
            )}
          </div>
          <span
            className={`badge shrink-0 self-start ${
              apt.status === "active"
                ? "badge-success"
                : apt.status === "pending"
                  ? "badge-warning"
                  : "badge-neutral"
            }`}
          >
            {getAppointmentStatusLabel(apt)}
          </span>
        </div>
        {statusDetail && (
          <div
            className={`mt-3 rounded-lg border px-3 py-2.5 ${
              statusDetail.tone === "warning"
                ? "border-amber-200 bg-amber-50 text-amber-950"
                : "border-gray-200 bg-gray-50 text-gray-700"
            }`}
          >
            <p className="font-medium">{statusDetail.title}</p>
            <p className="mt-1 leading-relaxed">{statusDetail.message}</p>
            <Link
              href={`/b/${slug}/app`}
              className="mt-2 inline-block text-sm font-medium underline underline-offset-2"
            >
              Reservar otro horario
            </Link>
          </div>
        )}
        {showActions && ["active", "pending"].includes(apt.status) && (
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
      {(business.require_booking_approval || pending.length > 0) && (
        <section>
          <h2 className="font-semibold text-gray-900">Pendientes de aprobación</h2>
          {pending.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">No tienes solicitudes pendientes.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {pending.map((apt) => (
                <Card key={apt.id} apt={apt} showActions />
              ))}
            </ul>
          )}
        </section>
      )}
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
          <>
            {historyTruncated && (
              <p className="mt-3 text-sm text-gray-500">
                Mostrando las últimas {CLIENT_HISTORY_LIMIT} entradas del historial.
              </p>
            )}
            <ul className="mt-3 space-y-3">
              {history.map((apt) => (
                <Card key={apt.id} apt={apt} showActions={false} />
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
