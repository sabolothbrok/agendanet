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

export function formatTime(date) {
  return new Date(date).toLocaleTimeString("es-CR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString("es-CR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateShort(date) {
  return new Date(date).toLocaleDateString("es-CR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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

/** Etiqueta de estado para reservas en historial del cliente */
export function getAppointmentStatusLabel(apt) {
  if (apt.status === "active") return "Activa";
  if (apt.status === "cancelled") {
    if (apt.cancelled_by === "admin") return "Cancelada por el negocio";
    return "Cancelada";
  }
  if (apt.status === "completed") return "Completada";
  return "Historial";
}

/** Genera slots de tiempo para un día */
export function generateTimeSlots(openHour, closeHour, slotMinutes) {
  const slots = [];
  const [openH, openM] = openHour.split(":").map(Number);
  const [closeH, closeM] = closeHour.split(":").map(Number);
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
  const [y, mo, d] = dateStr.split("-").map(Number);
  const [h, mi] = timeStr.split(":").map(Number);
  return new Date(y, mo - 1, d, h, mi, 0);
}

export function addMinutes(date, minutes) {
  return new Date(new Date(date).getTime() + minutes * 60_000);
}

export function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

export function getBusinessDayBounds(dateStr, openHour, closeHour) {
  const openStr = String(openHour).slice(0, 5);
  const closeStr = String(closeHour).slice(0, 5);
  return {
    dayStart: combineDateAndTime(dateStr, openStr),
    dayEnd: combineDateAndTime(dateStr, closeStr),
  };
}

export function fitsWithinBusinessHours(startAt, endAt, openHour, closeHour, dateStr) {
  const { dayStart, dayEnd } = getBusinessDayBounds(dateStr, openHour, closeHour);
  return startAt >= dayStart && endAt <= dayEnd;
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
  const start = combineDateAndTime(dateStr, time);
  const end = addMinutes(start, duration);

  if (!fitsWithinBusinessHours(start, end, openHour, closeHour, dateStr)) {
    return false;
  }

  for (const apt of appointments) {
    if (excludeAppointmentId && apt.id === excludeAppointmentId) continue;
    if (apt.space_id !== spaceId) continue;
    if (overlaps(start, end, new Date(apt.start_at), new Date(apt.end_at))) {
      return false;
    }
  }

  for (const block of blocks) {
    if (block.space_id !== spaceId) continue;
    if (overlaps(start, end, new Date(block.start_at), new Date(block.end_at))) {
      return false;
    }
  }

  return true;
}
