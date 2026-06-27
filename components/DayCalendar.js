"use client";

import { useMemo } from "react";
import {
  addMinutes,
  combineDateAndTime,
  formatTime,
  fitsWithinBusinessHours,
  generateTimeSlots,
  todayDateInputStr,
} from "@/lib/utils";

function slotStatus(spaceId, time, date, appointments, blocks, duration, business) {
  const normalizedSpaceId = String(spaceId);
  const start = combineDateAndTime(date, time);
  const end = addMinutes(start, Number(duration) || 0);

  for (const apt of appointments) {
    if (String(apt.space_id) !== normalizedSpaceId) continue;
    if (start < new Date(apt.end_at) && new Date(apt.start_at) < end) {
      return { type: "booked", data: apt };
    }
  }

  for (const block of blocks) {
    if (String(block.space_id) !== normalizedSpaceId) continue;
    if (start < new Date(block.end_at) && new Date(block.start_at) < end) {
      return { type: "blocked", data: block };
    }
  }

  if (
    business &&
    !fitsWithinBusinessHours(start, end, business.open_hour, business.close_hour, date)
  ) {
    return { type: "unavailable" };
  }

  return { type: "available" };
}

function SlotCell({
  mode,
  status,
  isSelected,
  spaceId,
  time,
  date,
  duration,
  currentCustomerId,
  onSelectSlot,
  onToggleBlock,
  onCancelAppointment,
}) {
  if (status.type === "booked") {
    const apt = status.data;
    const isOwn =
      mode === "customer" && (apt.is_mine || apt.customer_id === currentCustomerId);
    const label =
      mode === "admin"
        ? apt.customer_name || "Reservado"
        : isOwn
          ? "Tu reserva"
          : "Reservado";

    return (
      <div
        className={`slot-cell slot-cell-stack h-full ${
          isOwn ? "slot-own" : "slot-booked"
        }`}
      >
        <p className={`font-medium ${isOwn ? "text-gray-900" : "text-gray-800"}`}>
          {label}
        </p>
        <p className="text-gray-500">
          {formatTime(apt.start_at)} – {formatTime(apt.end_at)}
        </p>
        {mode === "admin" && onCancelAppointment && (
          <button
            type="button"
            onClick={() => onCancelAppointment(apt.id)}
            className="mt-1 text-xs text-red-600 hover:underline"
          >
            Cancelar
          </button>
        )}
      </div>
    );
  }

  if (status.type === "blocked") {
    const block = status.data;

    return (
      <div className="slot-cell slot-blocked slot-cell-stack h-full">
        <p className="font-medium text-gray-700">No disponible</p>
        <p className="text-gray-500">
          {formatTime(block.start_at)} – {formatTime(block.end_at)}
        </p>
        {mode === "admin" && onToggleBlock && (
          <button
            type="button"
            onClick={() =>
              onToggleBlock({ spaceId, time, block: false, blockId: block.id })
            }
            className="mt-1 text-xs font-medium text-gray-700 hover:underline"
          >
            Habilitar
          </button>
        )}
      </div>
    );
  }

  if (status.type === "unavailable") {
    const start = combineDateAndTime(date, time);
    const end = addMinutes(start, duration);

    return (
      <div className="slot-cell slot-unavailable slot-cell-stack h-full">
        <p className="font-medium text-gray-500">Fuera de horario</p>
        <p className="text-gray-400">
          {formatTime(start)} – {formatTime(end)}
        </p>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (mode === "admin" && onToggleBlock && !onSelectSlot) {
          onToggleBlock({ spaceId, time, block: true });
        } else if (onSelectSlot) {
          onSelectSlot({ spaceId, time });
        }
      }}
      className={`slot-cell h-full font-medium transition ${
        isSelected ? "slot-selected" : "slot-available"
      }`}
    >
      {mode === "admin" && !onSelectSlot ? "Marcar no disp." : "Disponible"}
    </button>
  );
}

export default function DayCalendar({
  mode = "customer",
  business,
  spaces,
  appointments,
  blocks,
  date,
  onDateChange,
  onSelectSlot,
  onToggleBlock,
  onCancelAppointment,
  selectedSlot,
  slotDuration,
  currentCustomerId,
}) {
  const duration = slotDuration || business.min_appointment_minutes;
  const openStr = String(business.open_hour).slice(0, 5);
  const closeStr = String(business.close_hour).slice(0, 5);
  const slots = useMemo(
    () => generateTimeSlots(openStr, closeStr, business.slot_minutes || 30),
    [openStr, closeStr, business.slot_minutes]
  );

  if (!spaces.length) {
    return (
      <div className="card p-6 text-center text-sm text-gray-600">
        No hay estaciones configuradas. El administrador debe definir al menos una en
        Configuración.
      </div>
    );
  }

  return (
    <div className="max-w-full min-w-0 space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <label className="text-sm font-medium text-gray-700">Fecha</label>
        <input
          type="date"
          value={date}
          min={todayDateInputStr()}
          onChange={(e) => onDateChange(e.target.value)}
          className="input sm:max-w-xs"
        />
      </div>

      {/* Mobile: cards por hora */}
      <div className="space-y-3 md:hidden">
        {slots.map((time) => (
          <div key={time} className="card p-3">
            <p className="mb-3 text-sm font-semibold text-gray-800">
              {formatTime(combineDateAndTime(date, time))}
            </p>
            <div className="grid grid-cols-1 gap-2">
              {spaces.map((sp) => {
                const status = slotStatus(
                  sp.id,
                  time,
                  date,
                  appointments,
                  blocks,
                  duration,
                  business
                );
                const isSelected =
                  selectedSlot &&
                  String(selectedSlot.spaceId) === String(sp.id) &&
                  selectedSlot.time === time;

                return (
                  <div key={sp.id} className="flex min-h-[52px] flex-col">
                    <p className="mb-1 shrink-0 text-xs font-medium text-gray-500">{sp.name}</p>
                    <div className="flex w-full flex-1">
                      <SlotCell
                        mode={mode}
                        status={status}
                        isSelected={isSelected}
                        spaceId={sp.id}
                        time={time}
                        date={date}
                        duration={duration}
                        currentCustomerId={currentCustomerId}
                        onSelectSlot={onSelectSlot}
                        onToggleBlock={onToggleBlock}
                        onCancelAppointment={onCancelAppointment}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: tabla con scroll horizontal */}
      <div className="scroll-table hidden max-w-full rounded-lg border border-gray-200 bg-white md:block">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="sticky left-0 z-10 bg-gray-50 px-3 py-2 text-left font-medium text-gray-500">
                Hora
              </th>
              {spaces.map((sp) => (
                <th key={sp.id} className="px-3 py-2 text-left font-medium text-gray-700">
                  {sp.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.map((time) => (
              <tr key={time} className="border-b border-gray-100">
                <td className="sticky left-0 z-10 bg-white px-3 py-2 text-gray-500 tabular-nums">
                  {formatTime(combineDateAndTime(date, time))}
                </td>
                {spaces.map((sp) => {
                  const status = slotStatus(
                    sp.id,
                    time,
                    date,
                    appointments,
                    blocks,
                    duration,
                    business
                  );
                  const isSelected =
                    selectedSlot &&
                    String(selectedSlot.spaceId) === String(sp.id) &&
                    selectedSlot.time === time;

                  return (
                    <td key={sp.id} className="h-px p-1 align-top">
                      <SlotCell
                        mode={mode}
                        status={status}
                        isSelected={isSelected}
                        spaceId={sp.id}
                        time={time}
                        date={date}
                        duration={duration}
                        currentCustomerId={currentCustomerId}
                        onSelectSlot={onSelectSlot}
                        onToggleBlock={onToggleBlock}
                        onCancelAppointment={onCancelAppointment}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
