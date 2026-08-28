import {
  BOOKING_DECLINED_BODY,
  BOOKING_DECLINED_TITLE,
  BOOKING_EXPIRED_BODY,
  BOOKING_EXPIRED_TITLE,
  BOOKING_REJECTED_TITLE,
  BOOKING_REJECTED_BODY,
} from "./constants";

/** Normaliza teléfono: solo dígitos */
export function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

export function slugify(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isValidSlug(slug) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export function formatPhone(phone) {
  const digits = normalizePhone(phone);
  if (digits.length === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }
  return digits;
}

const BUSINESS_TIMEZONE = "America/Costa_Rica";
const BUSINESS_UTC_OFFSET = "-06:00";

export const WEEKDAY_FULL_LABELS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

/** Fecha de hoy para inputs type="date" (zona del negocio). */
export function todayDateInputStr() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: BUSINESS_TIMEZONE }).format(new Date());
}

/** Fecha de mañana para inputs type="date" (zona del negocio). */
export function tomorrowDateInputStr() {
  return addDaysToDateInputStr(todayDateInputStr(), 1);
}

/** Suma días a una fecha YYYY-MM-DD en zona del negocio. */
export function addDaysToDateInputStr(dateStr, days) {
  const base = combineDateAndTime(dateStr, "12:00");
  const shifted = new Date(base.getTime() + days * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: BUSINESS_TIMEZONE }).format(shifted);
}

/** Inicio y fin del día calendario en zona del negocio. */
export function getCalendarDayBounds(dateStr) {
  return {
    start: new Date(`${dateStr}T00:00:00${BUSINESS_UTC_OFFSET}`),
    end: new Date(`${dateStr}T23:59:59.999${BUSINESS_UTC_OFFSET}`),
  };
}

export function formatTime(date) {
  return new Intl.DateTimeFormat("es-CR", {
    timeZone: BUSINESS_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(new Date(date))
    .toLowerCase();
}

function toDisplayInstant(value) {
  if (value == null) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return combineDateAndTime(value, "12:00");
  }
  return new Date(value);
}

export function formatDate(date) {
  const instant = toDisplayInstant(date);
  if (!instant || Number.isNaN(instant.getTime())) return "";
  return new Intl.DateTimeFormat("es-CR", {
    timeZone: BUSINESS_TIMEZONE,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(instant);
}

export function formatDateShort(date) {
  const instant = toDisplayInstant(date);
  if (!instant || Number.isNaN(instant.getTime())) return "";
  return new Intl.DateTimeFormat("es-CR", {
    timeZone: BUSINESS_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(instant);
}

export function formatPrice(amount) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

export function formatOptionalPrice(amount) {
  return Number(amount) > 0 ? formatPrice(amount) : "Sin precio";
}

/** Fecha YYYY-MM-DD de un instant en zona del negocio. */
export function toBusinessDateInputStr(date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: BUSINESS_TIMEZONE }).format(
    new Date(date)
  );
}

/** Etiqueta de estado para reservas en historial del cliente */
export function getAppointmentStatusLabel(apt) {
  if (apt.status === "pending") {
    if (new Date(apt.start_at) < new Date()) return "Solicitud expirada";
    return "Pendiente de aprobación";
  }
  if (apt.status === "active") {
    if (new Date(apt.end_at) <= new Date()) return "Completada";
    return "Activa";
  }
  if (apt.status === "cancelled") {
    if (apt.cancelled_by === "expired") return "Solicitud expirada";
    if (apt.cancelled_by === "declined") return "No confirmada";
    if (apt.cancelled_by === "rejected") return "No confirmada";
    if (apt.cancelled_by === "admin") return "Cancelada por el negocio";
    return "Cancelada";
  }
  if (apt.status === "completed") return "Completada";
  return "Historial";
}

/** Mensaje explicativo para el cliente según el estado de la reserva. */
export function getAppointmentStatusDetail(apt) {
  if (apt.status === "cancelled" && apt.cancelled_by === "expired") {
    return { title: BOOKING_EXPIRED_TITLE, message: BOOKING_EXPIRED_BODY, tone: "warning" };
  }
  if (apt.status === "cancelled" && apt.cancelled_by === "declined") {
    return { title: BOOKING_DECLINED_TITLE, message: BOOKING_DECLINED_BODY, tone: "warning" };
  }
  if (apt.status === "cancelled" && apt.cancelled_by === "rejected") {
    return {
      title: BOOKING_REJECTED_TITLE,
      message: BOOKING_REJECTED_BODY,
      tone: "warning",
    };
  }
  if (apt.status === "cancelled" && apt.cancelled_by === "admin") {
    return {
      title: "Cita cancelada",
      message:
        "El negocio canceló esta cita. Si necesitas reagendar, elige otro horario disponible.",
      tone: "neutral",
    };
  }
  return null;
}

/** Agrupa solicitudes pendientes: día → horario + espacio → personas. */
export function groupPendingAppointmentsBySlot(appointments) {
  const days = [];
  const dayIndex = new Map();

  for (const apt of appointments) {
    const dateKey = toBusinessDateInputStr(apt.start_at);
    let day = dayIndex.get(dateKey);
    if (!day) {
      day = { date: dateKey, label: formatDate(dateKey), slots: [], slotIndex: new Map() };
      dayIndex.set(dateKey, day);
      days.push(day);
    }

    const startMs = new Date(apt.start_at).getTime();
    const slotKey = `${apt.space_id}|${startMs}`;
    let slot = day.slotIndex.get(slotKey);
    if (!slot) {
      slot = {
        key: slotKey,
        spaceId: apt.space_id,
        spaceName: apt.space_name,
        startAt: apt.start_at,
        endAt: apt.end_at,
        appointments: [],
      };
      day.slotIndex.set(slotKey, slot);
      day.slots.push(slot);
    }
    slot.appointments.push(apt);
  }

  for (const day of days) {
    for (const slot of day.slots) {
      slot.appointments.sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );
    }
    delete day.slotIndex;
  }

  return days;
}

export function normalizeBusinessTime(timeValue) {
  return String(timeValue).slice(0, 5);
}

export function parseBusinessMinutes(timeValue) {
  const str = normalizeBusinessTime(timeValue);
  const [h, m] = str.split(":").map(Number);
  return h * 60 + m;
}

/** Hora HH:MM en zona del negocio (para validar instants ya construidos). */
export function extractBusinessTimeStr(date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(date));

  const hours = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minutes = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${hours}:${minutes}`;
}

/** Lunes de la semana que contiene la fecha, en zona del negocio. */
export function getMondayOfWeek(date = new Date()) {
  const todayStr = toBusinessDateInputStr(date);
  const mondayStr = addDaysToDateInputStr(todayStr, -weekdayIndexFromDateStr(todayStr));
  return combineDateAndTime(mondayStr, "12:00");
}

export function getWeekDates(date = new Date()) {
  const mondayStr = toBusinessDateInputStr(getMondayOfWeek(date));
  return Array.from({ length: 7 }, (_, i) =>
    combineDateAndTime(addDaysToDateInputStr(mondayStr, i), "12:00")
  );
}

export function toDateInputStr(date) {
  return toBusinessDateInputStr(date);
}

export function formatWeekRange(weekDates) {
  const start = weekDates[0];
  const end = weekDates[6];
  const startFmt = new Intl.DateTimeFormat("es-CR", {
    timeZone: BUSINESS_TIMEZONE,
    day: "numeric",
    month: "short",
  }).format(start);
  const endFmt = new Intl.DateTimeFormat("es-CR", {
    timeZone: BUSINESS_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(end);
  return `${startFmt} – ${endFmt}`;
}

/** Genera slots de tiempo para un día */
export function generateTimeSlots(openHour, closeHour, slotMinutes) {
  const slots = [];
  const openStr = normalizeBusinessTime(openHour);
  const closeStr = normalizeBusinessTime(closeHour);
  const [openH, openM] = openStr.split(":").map(Number);
  const [closeH, closeM] = closeStr.split(":").map(Number);
  let minutes = openH * 60 + openM;
  const end = closeH * 60 + closeM;

  while (minutes + slotMinutes <= end) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    slots.push(
      `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
    );
    minutes += slotMinutes;
  }
  return slots;
}

export function combineDateAndTime(dateStr, timeStr) {
  const time = String(timeStr).slice(0, 5);
  return new Date(`${dateStr}T${time}:00${BUSINESS_UTC_OFFSET}`);
}

/** El inicio del slot ya ocurrió (zona del negocio). */
export function isSlotStartInPast(dateStr, time) {
  const start = combineDateAndTime(dateStr, normalizeBusinessTime(time));
  return start.getTime() <= Date.now();
}

export function addMinutes(date, minutes) {
  return new Date(new Date(date).getTime() + minutes * 60_000);
}

export function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

export function getBusinessDayBounds(dateStr, openHour, closeHour) {
  const openStr = normalizeBusinessTime(openHour);
  const closeStr = normalizeBusinessTime(closeHour);
  return {
    dayStart: combineDateAndTime(dateStr, openStr),
    dayEnd: combineDateAndTime(dateStr, closeStr),
  };
}

export function fitsWithinBusinessHours(startAt, endAt, openHour, closeHour, dateStr) {
  const { dayStart, dayEnd } = getBusinessDayBounds(dateStr, openHour, closeHour);
  return startAt >= dayStart && endAt <= dayEnd;
}

/** 0 = lunes … 6 = domingo, en zona del negocio. */
export function weekdayIndexFromDateStr(dateStr) {
  const jsDay = new Date(`${dateStr}T12:00:00${BUSINESS_UTC_OFFSET}`).getUTCDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

function asOpenFlag(value) {
  return value === true || value === "t" || value === "true" || value === "on";
}

/** Horario efectivo para una fecha: semanal o por día. */
export function resolveHours(business, dateStr) {
  const weekday = weekdayIndexFromDateStr(dateStr);
  const fallback = {
    weekday,
    openHour: normalizeBusinessTime(business?.open_hour) || "09:00",
    closeHour: normalizeBusinessTime(business?.close_hour) || "18:00",
    isClosed: false,
  };

  if (!business?.use_custom_weekly_hours) return fallback;

  const rows = Array.isArray(business.weeklyHours) ? business.weeklyHours : [];
  const row = rows.find((h) => Number(h.weekday) === weekday);
  if (!row) return fallback;

  return {
    weekday,
    openHour: normalizeBusinessTime(row.open_hour) || fallback.openHour,
    closeHour: normalizeBusinessTime(row.close_hour) || fallback.closeHour,
    isClosed: !asOpenFlag(row.is_open),
  };
}

/** Valida si un bloque de tiempo puede reservarse en un espacio */
export function isSlotBookable({
  spaceId,
  time,
  dateStr,
  duration,
  openHour,
  closeHour,
  appointments = [],
  blocks = [],
  excludeAppointmentId = null,
}) {
  const normalizedSpaceId = String(spaceId);
  const slotTime = normalizeBusinessTime(time);
  const start = combineDateAndTime(dateStr, slotTime);
  const end = addMinutes(start, Number(duration) || 0);

  if (isSlotStartInPast(dateStr, slotTime)) {
    return false;
  }

  if (!fitsWithinBusinessHours(start, end, openHour, closeHour, dateStr)) {
    return false;
  }

  for (const apt of appointments) {
    if (excludeAppointmentId && apt.id === excludeAppointmentId) continue;
    if (apt.status === "pending") continue;
    if (String(apt.space_id) !== normalizedSpaceId) continue;
    if (overlaps(start, end, new Date(apt.start_at), new Date(apt.end_at))) {
      return false;
    }
  }

  for (const block of blocks) {
    if (String(block.space_id) !== normalizedSpaceId) continue;
    if (overlaps(start, end, new Date(block.start_at), new Date(block.end_at))) {
      return false;
    }
  }

  return true;
}
