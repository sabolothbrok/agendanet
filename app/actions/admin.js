"use server";

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
  upsertService,
  deleteService,
  getTodayAppointments,
  syncSpaceCount,
  updateSpaceName,
} from "@/lib/queries";
import { getSession } from "@/lib/session";
import { formatDateShort, formatTime } from "@/lib/utils";
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

export async function adminToggleBlock(slug, { spaceId, date, time, duration, block }) {
  const auth = await guard(slug);
  if (auth.error) return { error: "No autorizado" };

  const { combineDateAndTime, addMinutes } = await import("@/lib/utils");
  const startAt = combineDateAndTime(date, time);
  const endAt = addMinutes(startAt, duration || auth.business.min_appointment_minutes);

  if (block) {
    await createSpaceBlock({ spaceId, startAt, endAt, reason: "No disponible" });
  } else {
    const { blocks } = await getCalendarData(auth.business.id, date);
    const match = blocks.find(
      (b) =>
        b.space_id === spaceId &&
        new Date(b.start_at).getTime() === startAt.getTime()
    );
    if (match) await deleteSpaceBlock(match.id, auth.business.id);
  }

  revalidatePath(`/b/${slug}/admin/calendar`);
  return { success: true };
}

export async function adminGenerateInvite(slug) {
  const auth = await guard(slug);
  if (auth.error) return { error: "No autorizado" };

  const invite = await createInviteLink(auth.business.id);
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
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

  await updateBusinessSettings(auth.business.id, {
    min_modify_hours: Number(formData.get("min_modify_hours")),
    min_appointment_minutes: Number(formData.get("min_appointment_minutes")),
    show_services_list: formData.get("show_services_list") === "on",
    reminders_enabled: formData.get("reminders_enabled") === "on",
    notify_inactive_enabled: formData.get("notify_inactive_enabled") === "on",
    notify_inactive_days: Number(formData.get("notify_inactive_days")),
    notify_new_booking: formData.get("notify_new_booking") === "on",
    notify_cancel_booking: formData.get("notify_cancel_booking") === "on",
  });

  revalidatePath(`/b/${slug}/admin/settings`);
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
