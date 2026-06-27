"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import DayCalendar from "@/components/DayCalendar";
import { customerBook } from "@/app/actions/customer";
import {
  addMinutes,
  combineDateAndTime,
  formatDate,
  formatTime,
  isSlotBookable,
} from "@/lib/utils";
import { formatOptionalPrice } from "@/lib/utils";

export default function BookingClient({
  slug,
  business,
  date,
  calendarData,
  services,
  customerId,
}) {
  const router = useRouter();
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const duration = (() => {
    if (!business.show_services_list || !selectedServices.length) {
      return business.min_appointment_minutes;
    }
    const total = services
      .filter((s) => selectedServices.includes(s.id))
      .reduce((sum, s) => sum + s.duration_minutes, 0);
    return Math.max(total, business.min_appointment_minutes);
  })();

  const slotIsValid = selectedSlot
    ? isSlotBookable({
        spaceId: selectedSlot.spaceId,
        time: selectedSlot.time,
        dateStr: date,
        duration,
        openHour: business.open_hour,
        closeHour: business.close_hour,
        appointments: calendarData.appointments,
        blocks: calendarData.blocks,
      })
    : false;

  const validationMessage =
    selectedSlot && !slotIsValid
      ? "Ese horario ya no alcanza para la duración seleccionada."
      : "";

  function handleSelectSlot(slot) {
    setError("");
    setSelectedSlot(slot);
  }

  function toggleService(id) {
    setError("");
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!selectedSlot) {
      setError("Selecciona un espacio y hora en el calendario.");
      return;
    }
    if (!slotIsValid) {
      setError("Ese horario ya no alcanza para la duración seleccionada.");
      return;
    }
    setError("");
    const fd = new FormData();
    fd.set("date", date);
    fd.set("time", selectedSlot.time);
    fd.set("spaceId", selectedSlot.spaceId);
    selectedServices.forEach((id) => fd.append("serviceIds", id));

    startTransition(async () => {
      const res = await customerBook(slug, fd);
      if (res?.error) setError(res.error);
    });
  }

  const previewStart =
    selectedSlot && slotIsValid ? combineDateAndTime(date, selectedSlot.time) : null;
  const previewEnd = previewStart ? addMinutes(previewStart, duration) : null;
  const displayError = validationMessage || error;

  return (
    <div className="space-y-6">
      <DayCalendar
        mode="customer"
        business={business}
        spaces={calendarData.spaces}
        appointments={calendarData.appointments}
        blocks={calendarData.blocks}
        date={date}
        onDateChange={(d) => router.push(`?date=${d}`)}
        onSelectSlot={handleSelectSlot}
        selectedSlot={slotIsValid ? selectedSlot : null}
        slotDuration={duration}
        currentCustomerId={customerId}
      />

      <form onSubmit={handleSubmit} className="card space-y-4 p-6">
        {business.show_services_list && services.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-900">Servicios</h3>
            <div className="mt-2 space-y-2">
              {services.map((s) => (
                <label
                  key={s.id}
                  className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedServices.includes(s.id)}
                      onChange={() => toggleService(s.id)}
                    />
                    {s.name}
                    {s.is_premium && <span className="badge badge-warning">Premium</span>}
                  </span>
                  <span className="text-gray-500">
                    {s.duration_minutes} min · {formatOptionalPrice(s.price)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {previewStart && (
          <div className="rounded-lg bg-gray-50 p-4 text-sm">
            <p className="font-medium text-gray-900">Resumen</p>
            <p className="mt-1 text-gray-600">{formatDate(date)}</p>
            <p className="text-gray-600">
              {formatTime(previewStart)} – {formatTime(previewEnd)} ({duration} min)
            </p>
          </div>
        )}

        {displayError && <p className="text-sm text-red-600">{displayError}</p>}

        <button
          type="submit"
          disabled={isPending || !slotIsValid}
          className="btn btn-primary w-full"
        >
          {isPending ? "Reservando..." : "Confirmar reserva"}
        </button>
      </form>
    </div>
  );
}
