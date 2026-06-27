"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import DayCalendar from "@/components/DayCalendar";
import { adminToggleBlock, adminCancelAppointment } from "@/app/actions/admin";
import { useConfirm } from "@/hooks/useConfirm";
import { useToast } from "@/hooks/useToast";
import { addMinutes, combineDateAndTime, overlaps } from "@/lib/utils";

export default function AdminCalendarClient({ slug, business, date, calendarData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { confirm, dialog } = useConfirm();
  const toast = useToast();
  const [data, setData] = useState(calendarData);

  useEffect(() => {
    setData(calendarData);
  }, [calendarData]);

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
              reason: "No disponible",
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
        slotDuration={business.min_appointment_minutes}
      />
      <p className="mt-4 text-sm text-gray-500">
        Click en disponible = marcar no disponible. En reservas puedes cancelar.
      </p>
    </div>
  );
}
