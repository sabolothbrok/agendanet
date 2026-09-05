"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useState, useTransition } from "react";
import DayCalendar from "@/components/DayCalendar";
import PendingRequestsList from "@/components/PendingRequestsList";
import {
  adminToggleBlock,
  adminCancelAppointment,
  adminRescheduleAppointment,
} from "@/app/actions/admin";
import { useConfirm } from "@/hooks/useConfirm";
import { useToast } from "@/hooks/useToast";
import { addMinutes, combineDateAndTime, overlaps } from "@/lib/utils";

export default function AdminCalendarClient({ slug, business, date, calendarData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { confirm, dialog } = useConfirm();
  const toast = useToast();
  const [data, setData] = useState(calendarData);
  const [pendingSlot, setPendingSlot] = useState(null);
  const [prevCalendarData, setPrevCalendarData] = useState(calendarData);

  if (calendarData !== prevCalendarData) {
    setPrevCalendarData(calendarData);
    setData(calendarData);
    setPendingSlot(null);
  }

  function refresh() {
    startTransition(() => router.refresh());
  }

  function applyOptimisticBlock(payload) {
    const startAt = combineDateAndTime(date, payload.time);
    const endAt = addMinutes(startAt, business.min_appointment_minutes);

    setData((prev) => {
      if (payload.block) {
        if (
          prev.blocks.some(
            (b) =>
              b.space_id === payload.spaceId &&
              overlaps(startAt, endAt, new Date(b.start_at), new Date(b.end_at))
          )
        ) {
          return prev;
        }
        return {
          ...prev,
          blocks: [
            ...prev.blocks,
            {
              id: `temp-${payload.spaceId}-${payload.time}`,
              space_id: payload.spaceId,
              start_at: startAt.toISOString(),
              end_at: endAt.toISOString(),
              reason: "No Disponible",
            },
          ],
        };
      }

      return {
        ...prev,
        blocks: prev.blocks.filter((b) => {
          if (payload.blockId && b.id === payload.blockId) return false;
          if (b.space_id !== payload.spaceId) return true;
          return !overlaps(startAt, endAt, new Date(b.start_at), new Date(b.end_at));
        }),
      };
    });
  }

  async function handleToggleBlock(payload) {
    applyOptimisticBlock(payload);
    const res = await adminToggleBlock(slug, {
      ...payload,
      date,
      duration: business.min_appointment_minutes,
    });
    if (res?.error) {
      setData(calendarData);
      toast.error(res.error);
      refresh();
      return;
    }
    toast.success(payload.block ? "Horario marcado como no disponible." : "Horario habilitado.");
    refresh();
  }

  async function handleReschedule({ appointmentId, spaceId, time }) {
    const apt = data.appointments.find((a) => a.id === appointmentId);
    if (!apt) return;

    const durationMs = new Date(apt.end_at) - new Date(apt.start_at);
    const startAt = combineDateAndTime(date, time);
    const endAt = new Date(startAt.getTime() + durationMs);

    setData((prev) => ({
      ...prev,
      appointments: prev.appointments.map((a) =>
        a.id === appointmentId
          ? { ...a, space_id: spaceId, start_at: startAt.toISOString(), end_at: endAt.toISOString() }
          : a
      ),
    }));

    const res = await adminRescheduleAppointment(slug, appointmentId, { spaceId, date, time });
    if (res?.error) {
      setData(calendarData);
      toast.error(res.error);
      return;
    }
    toast.success("Cita reprogramada.");
    refresh();
  }

  async function handleCancel(id) {
    const ok = await confirm({
      title: "Cancelar cita",
      message: "¿Cancelar esta cita? El cliente verá el cambio en sus reservas.",
      confirmLabel: "Cancelar cita",
      cancelLabel: "Volver",
    });
    if (!ok) return;
    const res = await adminCancelAppointment(slug, id);
    if (res?.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Cita cancelada.");
    refresh();
  }

  return (
    <div className={isPending ? "opacity-60" : ""}>
      {dialog}
      <DayCalendar
        mode="admin"
        business={business}
        spaces={data.spaces}
        appointments={data.appointments}
        blocks={data.blocks}
        date={date}
        onDateChange={(d) => router.push(`?date=${d}`)}
        onToggleBlock={handleToggleBlock}
        onCancelAppointment={handleCancel}
        onOpenPending={setPendingSlot}
        onReschedule={handleReschedule}
        slotDuration={business.min_appointment_minutes}
      />
      <AnimatePresence>
        {pendingSlot?.length > 0 && (
          <motion.div
            className="card mt-4 p-4 sm:p-6"
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Solicitudes de este horario</h2>
              <button
                type="button"
                className="btn btn-secondary text-xs"
                onClick={() => setPendingSlot(null)}
              >
                Cerrar
              </button>
            </div>
            <div className="mt-4">
              <PendingRequestsList
                slug={slug}
                appointments={pendingSlot}
                onResolved={() => {
                  setPendingSlot(null);
                  refresh();
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Click en disponible = marcar no disponible. Arrastra una reserva confirmada a un
        horario disponible para reprogramarla. En reservas puedes cancelar. Las solicitudes
        pendientes aparecen en ámbar; al aprobar una, el espacio queda ocupado.
      </p>
    </div>
  );
}
