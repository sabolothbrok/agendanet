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
  getCalendarData,
  listAdmins,
  listCustomers,
  listNotifications,
  listServices,
  listSpaces,
  markNotificationRead,
  toggleCustomerPremium,
  updateBusinessSettings,
  updateBusinessSchedule,
  upsertService,
  deleteService,
  getTodayAppointments,
  syncSpaceCount,
  updateSpaceName,
} from "@/lib/queries";
import { getSession } from "@/lib/session";
import { formatDateShort, formatTime, normalizeBusinessTime, parseBusinessMinutes } from "@/lib/utils";
import { revalidatePath } from "next/cache";

async function guard(slug) {
  const session = await getSession();
  return requireAdminSession(session, slug);
}

export async function adminCancelAppointment(slug, appointmentId) {
  const auth = await guard(slug);
  if (auth.error) return { error: "No autorizado" };

  const apt = await cancelAppointment(appointmentId, auth.business.id, "admin");
  if (!apt) return { error: "No se pudo cancelar." };

  if (auth.business.notify_cancel_booking) {
    await createNotification({
      businessId: auth.business.id,
      recipientRole: "customer",
      recipientId: apt.customer_id,
      type: "cancel",
      title: "Cita cancelada",
      body: `Tu cita del ${formatDateShort(apt.start_at)} fue cancelada por el negocio.`,
    });
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
  const startAt = combineDateAndTime(date, time);
  const endAt = addMinutes(startAt, duration || auth.business.min_appointment_minutes);

  if (block) {
    const { blocks } = await getCalendarData(auth.business.id, date);
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

export async function adminDeleteCustomer(slug, customerId) {
  const auth = await guard(slug);
  if (auth.error) return { error: "No autorizado" };
  await deleteCustomer(customerId, auth.business.id);
  revalidatePath(`/b/${slug}/admin/customers`);
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

  const service = await upsertService(auth.business.id, {
    id: formData.get("id") || null,
    name: formData.get("name"),
    duration_minutes: Number(formData.get("duration_minutes")),
    price: Number(formData.get("price")) || 0,
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

  const minModifyHours = Number(formData.get("min_modify_hours"));
  const minAppointmentMinutes = Number(formData.get("min_appointment_minutes"));
  const notifyInactiveDays = Number(formData.get("notify_inactive_days"));

  if (!Number.isFinite(minModifyHours) || minModifyHours < 0) {
    return { error: "Las horas mínimas para modificar deben ser un número válido." };
  }
  if (!Number.isFinite(minAppointmentMinutes) || minAppointmentMinutes < 15) {
    return { error: "La duración mínima de cita debe ser al menos 15 minutos." };
  }
  if (!Number.isFinite(notifyInactiveDays) || notifyInactiveDays < 1) {
    return { error: "Los días sin cita para avisar deben ser al menos 1." };
  }

  await updateBusinessSchedule(auth.business.id, {
    openHour,
    closeHour,
    slotMinutes,
  });

  await updateBusinessSettings(auth.business.id, {
    min_modify_hours: minModifyHours,
    min_appointment_minutes: minAppointmentMinutes,
    show_services_list: formData.get("show_services_list") === "on",
    reminders_enabled: formData.get("reminders_enabled") === "on",
    notify_inactive_enabled: formData.get("notify_inactive_enabled") === "on",
    notify_inactive_days: notifyInactiveDays,
    notify_new_booking: formData.get("notify_new_booking") === "on",
    notify_cancel_booking: formData.get("notify_cancel_booking") === "on",
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
