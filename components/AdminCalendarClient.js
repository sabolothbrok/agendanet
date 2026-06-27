"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import DayCalendar from "@/components/DayCalendar";
import { adminToggleBlock, adminCancelAppointment } from "@/app/actions/admin";
import { useConfirm } from "@/hooks/useConfirm";

export default function AdminCalendarClient({ slug, business, date, calendarData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { confirm, dialog } = useConfirm();

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function handleToggleBlock(payload) {
    await adminToggleBlock(slug, {
      ...payload,
      date,
      duration: business.min_appointment_minutes,
    });
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
    await adminCancelAppointment(slug, id);
    refresh();
  }

  return (
    <div className={isPending ? "opacity-60" : ""}>
      {dialog}
      <DayCalendar
        mode="admin"
        business={business}
        spaces={calendarData.spaces}
        appointments={calendarData.appointments}
        blocks={calendarData.blocks}
        date={date}
        onDateChange={(d) => router.push(`?date=${d}`)}
        onToggleBlock={handleToggleBlock}
        onCancelAppointment={handleCancel}
        slotDuration={business.min_appointment_minutes}
      />
      <p className="mt-4 text-sm text-gray-500">
        Clic en disponible = marcar no disponible. En reservas puedes cancelar.
      </p>
    </div>
  );
}
