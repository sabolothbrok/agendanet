"use server";

import { getAppUrl } from "@/lib/env";
import { requireAdminSession } from "@/lib/auth";
import {
  cancelAppointment,
  createInviteLink,
  createNotification,
  createSpaceBlock,
  deleteCustomer,
  deleteSpaceBlock,
  getAppointmentById,
  getCalendarData,
  getActiveSpace,
  listAdmins,
  listCustomers,
  listNotifications,
  listServices,
  listSpaces,
  rescheduleAppointment,
  searchCustomers,
  markNotificationRead,
  toggleCustomerPremium,
  updateBusinessSettings,
  updateBusinessSchedule,
  replaceWeeklyHours,
  upsertService,
  deleteService,
  getTodayAppointments,
  syncSpaceCount,
  updateSpaceName,
  approveAppointment,
  rejectAppointment,
} from "@/lib/queries";
import { getSession } from "@/lib/session";
import {
  combineDateAndTime,
  addMinutes,
  fitsWithinBusinessHours,
  formatDateShort,
  formatPhone,
  formatTime,
  isSlotStartInPast,
  normalizeBusinessTime,
  parseBusinessMinutes,
  resolveHours,
} from "@/lib/utils";
import { revalidatePath } from "next/cache";

async function guard(slug) {
  const session = await getSession({ touch: true });
  return requireAdminSession(session, slug);
}

export async function adminCancelAppointment(slug, appointmentId) {
  const auth = await guard(slug);
  if (auth.error) return { error: "No autorizado" };

  const apt = await cancelAppointment(appointmentId, auth.business.id, "admin");
  if (!apt) return { error: "No se pudo cancelar." };

  if (auth.business.notify_cancel_booking) {
    const admins = await listAdmins(auth.business.id);
    for (const admin of admins) {
      await createNotification({
        businessId: auth.business.id,
        recipientRole: "admin",
        recipientId: admin.id,
        type: "cancel",
        title: "Cita cancelada",
        body: `Se canceló una cita el ${formatDateShort(apt.start_at)} a las ${formatTime(apt.start_at)}.`,
      });
    }
  }

  revalidatePath(`/b/${slug}/admin`);
  revalidatePath(`/b/${slug}/admin/calendar`);
  return { success: true };
}

export async function adminToggleBlock(slug, { spaceId, date, time, duration, block, blockId }) {
  const auth = await guard(slug);
  if (auth.error) return { error: "No autorizado" };

  const { combineDateAndTime, addMinutes, overlaps } = await import("@/lib/utils");
  const space = await getActiveSpace(auth.business.id, spaceId);
  if (!space && block) return { error: "Espacio inválido." };

  const startAt = combineDateAndTime(date, time);
  const endAt = addMinutes(startAt, duration || auth.business.min_appointment_minutes);

  if (block) {
    const { appointments, blocks } = await getCalendarData(auth.business.id, date);
    const hasAppointment = appointments.some(
      (a) =>
        a.status !== "pending" &&
        a.space_id === spaceId &&
        overlaps(startAt, endAt, new Date(a.start_at), new Date(a.end_at))
    );
    if (hasAppointment) {
      return { error: "Hay una cita en ese horario. Cancélala antes de bloquear." };
    }
    const alreadyBlocked = blocks.some(
      (b) =>
        b.space_id === spaceId &&
        overlaps(startAt, endAt, new Date(b.start_at), new Date(b.end_at))
    );
    if (!alreadyBlocked) {
      await createSpaceBlock({ spaceId, startAt, endAt, reason: "No Disponible" });
    }
  } else if (blockId) {
    await deleteSpaceBlock(blockId, auth.business.id);
  } else {
    const { blocks } = await getCalendarData(auth.business.id, date);
    const match = blocks.find(
      (b) =>
        b.space_id === spaceId &&
        overlaps(startAt, endAt, new Date(b.start_at), new Date(b.end_at))
    );
    if (!match) return { error: "No hay bloqueo en este horario." };
    await deleteSpaceBlock(match.id, auth.business.id);
  }

  revalidatePath(`/b/${slug}/admin/calendar`);
  revalidatePath(`/b/${slug}/app`);
  return { success: true };
}

export async function adminRescheduleAppointment(slug, appointmentId, { spaceId, date, time }) {
  const auth = await guard(slug);
  if (auth.error) return { error: "No autorizado" };

  if (isSlotStartInPast(date, time)) {
    return { error: "Ese horario ya pasó." };
  }

  const space = await getActiveSpace(auth.business.id, spaceId);
  if (!space) return { error: "Espacio inválido." };

  const appointment = await getAppointmentById(appointmentId, auth.business.id);
  if (!appointment) return { error: "Cita no encontrada." };

  const durationMs = new Date(appointment.end_at) - new Date(appointment.start_at);
  const startAt = combineDateAndTime(date, time);
  const endAt = new Date(startAt.getTime() + durationMs);

  const hours = resolveHours(auth.business, date);
  if (hours.isClosed || !fitsWithinBusinessHours(startAt, endAt, hours.openHour, hours.closeHour, date)) {
    return { error: "Ese horario está fuera del horario de atención." };
  }

  const result = await rescheduleAppointment(appointmentId, auth.business.id, {
    spaceId,
    startAt,
    endAt,
  });
  if (result.error === "blocked") return { error: "Ese horario está marcado como no disponible." };
  if (result.error === "conflict") return { error: "Ya hay una cita en ese horario." };
  if (result.error) return { error: "No se pudo reprogramar la cita." };

  revalidatePath(`/b/${slug}/admin/calendar`);
  revalidatePath(`/b/${slug}/app`);
  return { success: true };
}

export async function adminGenerateInvite(slug) {
  const auth = await guard(slug);
  if (auth.error) return { error: "No autorizado" };

  const invite = await createInviteLink(auth.business.id);
  const base = getAppUrl();
  return {
    link: `${base}/b/${slug}/join?token=${invite.token}`,
    expiresAt: invite.expiresAt,
  };
}

export async function adminSearchCustomers(slug, query) {
  const auth = await guard(slug);
  if (auth.error) return { error: "No autorizado" };
  if (!query || query.trim().length < 2) return { customers: [] };

  const customers = await searchCustomers(auth.business.id, query.trim());
  return { customers };
}

export async function adminDeleteCustomer(slug, customerId) {
  const auth = await guard(slug);
  if (auth.error) return { error: "No autorizado" };

  const customer = await deleteCustomer(customerId, auth.business.id);
  if (!customer) return { error: "El cliente ya no existe." };

  const label = customer.name || formatPhone(customer.phone) || "Un cliente";
  const admins = await listAdmins(auth.business.id);
  for (const admin of admins) {
    await createNotification({
      businessId: auth.business.id,
      recipientRole: "admin",
      recipientId: admin.id,
      type: "customer",
      title: "Cliente eliminado",
      body: `${label} fue eliminado. Sus citas se cancelaron y el horario quedó libre.`,
    });
  }

  revalidatePath(`/b/${slug}/admin/customers`);
  revalidatePath(`/b/${slug}/admin`);
  revalidatePath(`/b/${slug}/admin/calendar`);
  revalidatePath(`/b/${slug}/admin/reports`);
  revalidatePath(`/b/${slug}/app`);
  revalidatePath(`/b/${slug}/app/reservations`);
  return { success: true };
}

export async function adminTogglePremium(slug, customerId, isPremium) {
  const auth = await guard(slug);
  if (auth.error) return { error: "No autorizado" };
  await toggleCustomerPremium(customerId, auth.business.id, isPremium);
  revalidatePath(`/b/${slug}/admin/customers`);
  return { success: true };
}

export async function adminSaveService(slug, formData) {
  const auth = await guard(slug);
  if (auth.error) return { error: "No autorizado" };

  const name = String(formData.get("name") || "").trim();
  const durationMinutes = Number(formData.get("duration_minutes"));
  const price = Number(formData.get("price"));
  if (!name) return { error: "Ingresa el nombre del servicio." };
  if (!Number.isFinite(durationMinutes) || durationMinutes < 5) {
    return { error: "La duración debe ser de al menos 5 minutos." };
  }
  if (!Number.isFinite(price) || price < 0) {
    return { error: "El precio no puede ser negativo." };
  }

  const service = await upsertService(auth.business.id, {
    id: formData.get("id") || null,
    name,
    duration_minutes: durationMinutes,
    price,
    is_premium: formData.get("is_premium") === "on",
    is_active: formData.get("is_active") !== "off",
  });

  revalidatePath(`/b/${slug}/admin/services`);
  revalidatePath(`/b/${slug}/app`);
  return { success: true, service };
}

export async function adminDeleteService(slug, serviceId) {
  const auth = await guard(slug);
  if (auth.error) return { error: "No autorizado" };

  const result = await deleteService(serviceId, auth.business.id);
  revalidatePath(`/b/${slug}/admin/services`);
  revalidatePath(`/b/${slug}/app`);
  return { success: true, ...result };
}

export async function adminSaveSettings(slug, formData) {
  const auth = await guard(slug);
  if (auth.error) return { error: "No autorizado" };

  const openHour = normalizeBusinessTime(formData.get("open_hour") || "");
  const closeHour = normalizeBusinessTime(formData.get("close_hour") || "");
  const slotMinutes = Number(formData.get("slot_minutes"));
  const useCustomWeeklyHours = formData.get("schedule_mode") === "custom";

  if (!/^\d{2}:\d{2}$/.test(openHour) || !/^\d{2}:\d{2}$/.test(closeHour)) {
    return { error: "Ingresa un horario de apertura y cierre válido." };
  }

  const openMinutes = parseBusinessMinutes(openHour);
  const closeMinutes = parseBusinessMinutes(closeHour);
  if (!(closeMinutes > openMinutes)) {
    return { error: "La hora de cierre debe ser posterior a la de apertura." };
  }

  if (![15, 30, 60].includes(slotMinutes)) {
    return { error: "El intervalo del calendario debe ser 15, 30 o 60 minutos." };
  }

  let weeklyDays = null;
  if (useCustomWeeklyHours) {
    weeklyDays = [];
    for (let weekday = 0; weekday <= 6; weekday += 1) {
      const isOpen = formData.get(`day_${weekday}_open`) === "on";
      const dayOpen = normalizeBusinessTime(formData.get(`day_${weekday}_open_hour`) || openHour);
      const dayClose = normalizeBusinessTime(formData.get(`day_${weekday}_close_hour`) || closeHour);
      if (!/^\d{2}:\d{2}$/.test(dayOpen) || !/^\d{2}:\d{2}$/.test(dayClose)) {
        return { error: "Cada día abierto necesita un horario válido." };
      }
      if (!(parseBusinessMinutes(dayClose) > parseBusinessMinutes(dayOpen))) {
        return { error: "En cada día abierto, el cierre debe ser posterior a la apertura." };
      }
      weeklyDays.push({ weekday, isOpen, openHour: dayOpen, closeHour: dayClose });
    }
    if (!weeklyDays.some((d) => d.isOpen)) {
      return { error: "Debe haber al menos un día de atención." };
    }
  }

  const minModifyHours = Number(formData.get("min_modify_hours"));
  const minAppointmentMinutes = Number(formData.get("min_appointment_minutes"));

  if (!Number.isFinite(minModifyHours) || minModifyHours < 0) {
    return { error: "Las horas mínimas para modificar deben ser un número válido." };
  }
  if (!Number.isFinite(minAppointmentMinutes) || minAppointmentMinutes < slotMinutes) {
    return { error: "La duración mínima de cita debe ser al menos el intervalo del calendario." };
  }
  if (minAppointmentMinutes % slotMinutes !== 0) {
    return { error: "La duración mínima debe ser un múltiplo del intervalo del calendario." };
  }

  await updateBusinessSchedule(auth.business.id, {
    openHour,
    closeHour,
    slotMinutes,
  });

  if (weeklyDays) {
    await replaceWeeklyHours(auth.business.id, weeklyDays);
  } else {
    await replaceWeeklyHours(auth.business.id, []);
  }

  await updateBusinessSettings(auth.business.id, {
    min_modify_hours: minModifyHours,
    min_appointment_minutes: minAppointmentMinutes,
    show_services_list: formData.get("show_services_list") === "on",
    reminders_enabled: Boolean(auth.business.reminders_enabled),
    notify_inactive_enabled: false,
    notify_inactive_days: Number(auth.business.notify_inactive_days) || 30,
    notify_new_booking: formData.get("notify_new_booking") === "on",
    notify_cancel_booking: formData.get("notify_cancel_booking") === "on",
    require_booking_approval: formData.get("require_booking_approval") === "on",
    use_custom_weekly_hours: useCustomWeeklyHours,
  });

  revalidatePath(`/b/${slug}/admin/settings`);
  revalidatePath(`/b/${slug}/admin/calendar`);
  revalidatePath(`/b/${slug}/admin`);
  revalidatePath(`/b/${slug}/admin/reports`);
  revalidatePath(`/b/${slug}/app`);
  return { success: true };
}

export async function adminSetSpaceCount(slug, count) {
  const auth = await guard(slug);
  if (auth.error) return { error: "No autorizado" };

  const result = await syncSpaceCount(auth.business.id, Number(count));
  if (result.error) return { error: result.error };

  const spaces = await listSpaces(auth.business.id);

  revalidatePath(`/b/${slug}/admin/settings`);
  revalidatePath(`/b/${slug}/admin/calendar`);
  revalidatePath(`/b/${slug}/app`);
  return { success: true, spaces };
}

export async function adminRenameSpace(slug, spaceId, name) {
  const auth = await guard(slug);
  if (auth.error) return { error: "No autorizado" };

  const trimmed = String(name || "").trim();
  if (!trimmed) return { error: "El nombre no puede estar vacío." };

  await updateSpaceName(spaceId, auth.business.id, trimmed);

  revalidatePath(`/b/${slug}/admin/settings`);
  revalidatePath(`/b/${slug}/admin/calendar`);
  revalidatePath(`/b/${slug}/app`);
  return { success: true };
}

export async function adminMarkRead(slug, formData) {
  const auth = await guard(slug);
  if (auth.error) return { error: "No autorizado" };
  const notificationId = formData.get("notificationId");
  await markNotificationRead(notificationId, "admin", auth.adminUserId);
  revalidatePath(`/b/${slug}/admin`);
  return { success: true };
}

export async function adminApproveAppointment(slug, appointmentId) {
  const auth = await guard(slug);
  if (auth.error) return { error: "No autorizado" };

  const result = await approveAppointment(appointmentId, auth.business.id);
  if (result.error) return { error: result.error };

  const apt = result.appointment;
  if (auth.business.notify_new_booking) {
    const admins = await listAdmins(auth.business.id);
    for (const admin of admins) {
      await createNotification({
        businessId: auth.business.id,
        recipientRole: "admin",
        recipientId: admin.id,
        type: "booking",
        title: "Reserva confirmada",
        body: `Se aprobó la cita de ${formatDateShort(apt.start_at)} a las ${formatTime(apt.start_at)}.`,
      });
    }
  }

  revalidatePath(`/b/${slug}/admin`);
  revalidatePath(`/b/${slug}/admin/calendar`);
  revalidatePath(`/b/${slug}/app`);
  revalidatePath(`/b/${slug}/app/reservations`);
  return { success: true, rejectedCount: (result.rejected || []).length };
}

export async function adminRejectAppointment(slug, appointmentId) {
  const auth = await guard(slug);
  if (auth.error) return { error: "No autorizado" };

  const apt = await rejectAppointment(appointmentId, auth.business.id, "declined");
  if (!apt) return { error: "La solicitud ya no está pendiente." };

  if (auth.business.notify_cancel_booking) {
    const admins = await listAdmins(auth.business.id);
    for (const admin of admins) {
      await createNotification({
        businessId: auth.business.id,
        recipientRole: "admin",
        recipientId: admin.id,
        type: "booking",
        title: "Solicitud no confirmada",
        body: `No se confirmó la solicitud de ${formatDateShort(apt.start_at)} a las ${formatTime(apt.start_at)}.`,
      });
    }
  }

  revalidatePath(`/b/${slug}/admin`);
  revalidatePath(`/b/${slug}/admin/calendar`);
  revalidatePath(`/b/${slug}/app`);
  revalidatePath(`/b/${slug}/app/reservations`);
  return { success: true };
}
