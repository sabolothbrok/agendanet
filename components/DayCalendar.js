"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  addMinutes,
  combineDateAndTime,
  formatTime,
  fitsWithinBusinessHours,
  generateTimeSlots,
  isSlotStartInPast,
  resolveHours,
  todayDateInputStr,
  tomorrowDateInputStr,
} from "@/lib/utils";

function overlappingAppointments(spaceId, time, date, appointments, duration) {
  const normalizedSpaceId = String(spaceId);
  const start = combineDateAndTime(date, time);
  const end = addMinutes(start, Number(duration) || 0);
  return appointments.filter((apt) => {
    if (String(apt.space_id) !== normalizedSpaceId) return false;
    return start < new Date(apt.end_at) && new Date(apt.start_at) < end;
  });
}

function slotStatus(spaceId, time, date, appointments, blocks, duration, hours, mode, currentCustomerId) {
  const overlapping = overlappingAppointments(spaceId, time, date, appointments, duration);
  const active = overlapping.filter((apt) => apt.status !== "pending");
  const pending = overlapping.filter((apt) => apt.status === "pending");

  if (mode === "admin") {
    if (active.length > 0) {
      return { type: "booked", data: active[0], pending };
    }
    if (pending.length > 0) {
      return { type: "pending_requests", data: pending };
    }
  } else {
    const ownActive = active.find(
      (apt) => apt.is_mine || apt.customer_id === currentCustomerId
    );
    if (ownActive || active.length > 0) {
      return { type: "booked", data: ownActive || active[0] };
    }
    const ownPending = pending.find(
      (apt) => apt.is_mine || apt.customer_id === currentCustomerId
    );
    if (ownPending) {
      return { type: "pending_own", data: ownPending };
    }
  }

  const normalizedSpaceId = String(spaceId);
  const start = combineDateAndTime(date, time);
  const end = addMinutes(start, Number(duration) || 0);

  for (const block of blocks) {
    if (String(block.space_id) !== normalizedSpaceId) continue;
    if (start < new Date(block.end_at) && new Date(block.start_at) < end) {
      return { type: "blocked", data: block };
    }
  }

  if (
    hours?.isClosed ||
    (hours &&
      !fitsWithinBusinessHours(start, end, hours.openHour, hours.closeHour, date))
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
  onOpenPending,
  onReschedule,
  draggingId,
  onDragStateChange,
}) {
  const [dragOver, setDragOver] = useState(false);

  if (status.type === "booked") {
    const apt = status.data;
    const isOwn =
      mode === "customer" && (apt.is_mine || apt.customer_id === currentCustomerId);
    if (mode === "customer" && !isOwn) {
      return (
        <div className="slot-cell slot-blocked slot-cell-stack h-full">
          <p className="font-medium text-rose-900 dark:text-rose-300">No Disponible</p>
          <p className="text-rose-700/80 dark:text-rose-400/80">
            {formatTime(apt.start_at)} – {formatTime(apt.end_at)}
          </p>
        </div>
      );
    }

    const label = mode === "admin" ? apt.customer_name || "Reservado" : "Tu reserva";
    const canDrag = mode === "admin" && !!onReschedule && apt.status === "active";

    return (
      <div
        draggable={canDrag}
        onDragStart={
          canDrag
            ? (e) => {
                e.dataTransfer.setData("text/plain", apt.id);
                e.dataTransfer.effectAllowed = "move";
                onDragStateChange?.(apt.id);
              }
            : undefined
        }
        onDragEnd={canDrag ? () => onDragStateChange?.(null) : undefined}
        className={`slot-cell slot-cell-stack h-full ${
          isOwn ? "slot-own" : "slot-booked"
        } ${canDrag ? "slot-draggable" : ""} ${draggingId === apt.id ? "slot-dragging" : ""}`}
      >
        <p className={`font-medium ${isOwn ? "text-gray-900 dark:text-gray-100" : "text-gray-800 dark:text-gray-200"}`}>
          {label}
        </p>
        <p className="text-gray-500 dark:text-gray-400">
          {formatTime(apt.start_at)} – {formatTime(apt.end_at)}
        </p>
        {mode === "admin" && apt.services?.length > 0 && (
          <p className="text-gray-500 dark:text-gray-400 break-words">{apt.services.map((s) => s.name).join(", ")}</p>
        )}
        {mode === "admin" && onCancelAppointment && (
          <button
            type="button"
            onClick={() => onCancelAppointment(apt.id)}
            className="mt-1 text-xs text-red-600 hover:underline dark:text-red-400"
          >
            Cancelar
          </button>
        )}
        {mode === "admin" && status.pending?.length > 0 && onOpenPending && (
          <button
            type="button"
            onClick={() => onOpenPending(status.pending)}
            className="mt-1 text-xs font-medium text-amber-800 hover:underline dark:text-amber-400"
          >
            {status.pending.length === 1
              ? "1 solicitud en conflicto"
              : `${status.pending.length} solicitudes en conflicto`}
          </button>
        )}
      </div>
    );
  }

  if (status.type === "pending_requests") {
    const count = status.data.length;
    return (
      <button
        type="button"
        onClick={() => onOpenPending?.(status.data)}
        className="slot-cell slot-cell-stack slot-pending h-full"
      >
        <p className="font-medium text-amber-950 dark:text-amber-300">
          {count} {count === 1 ? "solicitud" : "solicitudes"}
        </p>
        <p className="text-amber-800/80 dark:text-amber-400/80">Pendiente de aprobación</p>
      </button>
    );
  }

  if (status.type === "pending_own") {
    const apt = status.data;
    return (
      <div className="slot-cell slot-cell-stack slot-pending h-full">
        <p className="font-medium text-amber-950 dark:text-amber-300">Solicitud pendiente</p>
        <p className="text-amber-800/80 dark:text-amber-400/80">
          {formatTime(apt.start_at)} – {formatTime(apt.end_at)}
        </p>
      </div>
    );
  }

  if (status.type === "blocked") {
    const block = status.data;

    return (
      <div className="slot-cell slot-blocked slot-cell-stack h-full">
        <p className="font-medium text-rose-900 dark:text-rose-300">No Disponible</p>
        <p className="text-rose-700/80 dark:text-rose-400/80">
          {formatTime(block.start_at)} – {formatTime(block.end_at)}
        </p>
        {mode === "admin" && onToggleBlock && (
          <button
            type="button"
            onClick={() =>
              onToggleBlock({ spaceId, time, block: false, blockId: block.id })
            }
            className="mt-1 text-xs font-medium text-rose-900 hover:underline dark:text-rose-300"
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
        <p className="font-medium text-gray-500 dark:text-gray-400">Fuera de horario</p>
        <p className="text-gray-400 dark:text-gray-500">
          {formatTime(start)} – {formatTime(end)}
        </p>
      </div>
    );
  }

  const canDrop = mode === "admin" && !!onReschedule && !!draggingId;

  return (
    <motion.button
      type="button"
      onClick={() => {
        if (mode === "admin" && onToggleBlock && !onSelectSlot) {
          onToggleBlock({ spaceId, time, block: true });
        } else if (onSelectSlot) {
          onSelectSlot({ spaceId, time });
        }
      }}
      onDragOver={
        canDrop
          ? (e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (!dragOver) setDragOver(true);
            }
          : undefined
      }
      onDragLeave={canDrop ? () => setDragOver(false) : undefined}
      onDrop={
        canDrop
          ? (e) => {
              e.preventDefault();
              setDragOver(false);
              const appointmentId = e.dataTransfer.getData("text/plain");
              onDragStateChange?.(null);
              if (appointmentId) onReschedule({ appointmentId, spaceId, time });
            }
          : undefined
      }
      className={`slot-cell relative h-full font-medium transition ${
        isSelected ? "slot-selected" : "slot-available"
      } ${dragOver ? "slot-drop-target" : ""}`}
      whileHover={{ scale: 1.03, zIndex: 20 }}
      whileTap={{ scale: 0.97, zIndex: 20 }}
      transition={{ duration: 0.12 }}
    >
      Disponible
    </motion.button>
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
  onOpenPending,
  onReschedule,
  selectedSlot,
  slotDuration,
  currentCustomerId,
}) {
  const [draggingId, setDraggingId] = useState(null);
  const duration = slotDuration || business.min_appointment_minutes;
  const hours = useMemo(() => resolveHours(business, date), [business, date]);
  const openStr = hours.openHour;
  const closeStr = hours.closeHour;
  const slots = useMemo(
    () => generateTimeSlots(openStr, closeStr, business.slot_minutes || 30),
    [openStr, closeStr, business.slot_minutes]
  );
  const visibleSlots = useMemo(() => {
    if (hours.isClosed && mode === "customer") return [];
    if (mode !== "customer") return slots;
    return slots.filter((time) => !isSlotStartInPast(date, time));
  }, [slots, mode, date, hours.isClosed]);
  const isDesktop = useMediaQuery("(min-width: 768px)", false);
  const isToday = date === todayDateInputStr();

  if (!spaces.length) {
    return (
      <div className="card p-6 text-center text-sm text-gray-600 dark:text-gray-400">
        No hay estaciones configuradas. El administrador debe definir al menos una en
        Configuración.
      </div>
    );
  }

  return (
    <div className="max-w-full min-w-0 space-y-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <label htmlFor="calendar-date" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Fecha
        </label>
        <input
          id="calendar-date"
          type="date"
          value={date}
          min={todayDateInputStr()}
          onChange={(e) => onDateChange(e.target.value)}
          className="input input-date"
        />
      </div>

      {hours.isClosed && mode === "admin" ? (
        <div className="card space-y-1 p-4 text-sm text-gray-600 dark:text-gray-400 sm:p-5">
          <p className="font-medium text-gray-900 dark:text-gray-100">Cerrado este día</p>
          <p>
            En la configuración este día no tiene atención. Las reservas existentes siguen
            visibles.
          </p>
        </div>
      ) : null}

      {mode === "customer" && visibleSlots.length === 0 ? (
        <div className="card space-y-3 p-4 text-sm text-gray-600 dark:text-gray-400 sm:p-5">
          {hours.isClosed ? (
            <>
              <p className="font-medium text-gray-900 dark:text-gray-100">El negocio no atiende este día</p>
              <p>Te invitamos a elegir otra fecha en el calendario.</p>
              {isToday && (
                <button
                  type="button"
                  onClick={() => onDateChange(tomorrowDateInputStr())}
                  className="btn btn-secondary text-sm"
                >
                  Ver disponibilidad de mañana
                </button>
              )}
            </>
          ) : isToday ? (
            <>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                No hay más horarios disponibles para hoy
              </p>
              <p>
                El horario de atención de hoy ya finalizó o no quedan espacios disponibles.
                Te invitamos a consultar la disponibilidad de mañana u otra fecha.
              </p>
              <button
                type="button"
                onClick={() => onDateChange(tomorrowDateInputStr())}
                className="btn btn-secondary text-sm"
              >
                Ver disponibilidad de mañana
              </button>
            </>
          ) : (
            <p>
              No hay horarios disponibles para este día. Elige otra fecha en el calendario.
            </p>
          )}
        </div>
      ) : null}

      {/* Mobile: cards por hora (no renderizar tabla ancha en el DOM) */}
      {!isDesktop && visibleSlots.length > 0 && (
      <div className="space-y-3">
        {visibleSlots.map((time) => (
          <div key={time} className="card p-3">
            <p className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-200">
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
                  hours,
                  mode,
                  currentCustomerId
                );
                const isSelected =
                  selectedSlot &&
                  String(selectedSlot.spaceId) === String(sp.id) &&
                  selectedSlot.time === time;

                return (
                  <div key={sp.id} className="flex min-h-[52px] flex-col">
                    <p className="mb-1 shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400">{sp.name}</p>
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
                        onOpenPending={onOpenPending}
                        onReschedule={onReschedule}
                        draggingId={draggingId}
                        onDragStateChange={setDraggingId}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Desktop: tabla con scroll horizontal */}
      {isDesktop && visibleSlots.length > 0 && (
      <div className="scroll-table max-w-full rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
              <th className="sticky left-0 z-10 bg-gray-50 px-3 py-2 text-left font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                Hora
              </th>
              {spaces.map((sp) => (
                <th key={sp.id} className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                  {sp.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleSlots.map((time) => (
              <tr key={time} className="border-b border-gray-100 dark:border-gray-800">
                <td className="sticky left-0 z-10 bg-white px-3 py-2 text-gray-500 tabular-nums dark:bg-gray-900 dark:text-gray-400">
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
                    hours,
                    mode,
                    currentCustomerId
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
                        onOpenPending={onOpenPending}
                        onReschedule={onReschedule}
                        draggingId={draggingId}
                        onDragStateChange={setDraggingId}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}
