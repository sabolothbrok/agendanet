"use server";

import { requireCustomerSession } from "@/lib/auth";
import {
  createAppointment,
  createNotification,
  cancelAppointment,
  updateAppointment,
  getCalendarData,
  listAdmins,
  listServices,
  listCustomerAppointments,
} from "@/lib/queries";
import { getSession } from "@/lib/session";
import {
  addMinutes,
  combineDateAndTime,
  formatDateShort,
  formatTime,
  fitsWithinBusinessHours,
  isSlotBookable,
} from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function guard(slug) {
  const session = await getSession();
  return requireCustomerSession(session, slug);
}

function calcDuration(business, services, selectedIds) {
  if (!business.show_services_list || !selectedIds?.length) {
    return business.min_appointment_minutes;
  }
  const total = services
    .filter((s) => selectedIds.includes(s.id))
    .reduce((sum, s) => sum + s.duration_minutes, 0);
  return Math.max(total, business.min_appointment_minutes);
}

function businessFilterServices(business, serviceIds, allowed) {
  if (!business.show_services_list) return [];
  return serviceIds.filter((id) => allowed.some((s) => s.id === id));
}

async function isSlotFree(business, spaceId, startAt, endAt, dateStr, excludeId = null) {
  const duration = (endAt - startAt) / 60_000;
  const time = `${String(startAt.getHours()).padStart(2, "0")}:${String(startAt.getMinutes()).padStart(2, "0")}`;
  const { appointments, blocks } = await getCalendarData(business.id, dateStr);

  return isSlotBookable({
    spaceId,
    time,
    dateStr,
    duration,
    openHour: business.open_hour,
    closeHour: business.close_hour,
    appointments,
    blocks,
    excludeAppointmentId: excludeId,
  });
}

function validateBookingTimes(business, date, time, duration) {
  const startAt = combineDateAndTime(date, time);
  const endAt = addMinutes(startAt, duration);

  if (!fitsWithinBusinessHours(startAt, endAt, business.open_hour, business.close_hour, date)) {
    return {
      error: `La reserva termina después del horario de cierre (${String(business.close_hour).slice(0, 5)}).`,
    };
  }

  return { startAt, endAt };
}

export async function customerBook(slug, formData) {
  const auth = await guard(slug);
  if (auth.error) return { error: "No autorizado" };

  const date = formData.get("date");
  const time = formData.get("time");
  const spaceId = formData.get("spaceId");
  const serviceIds = formData.getAll("serviceIds");

  const services = await listServices(auth.business.id, { activeOnly: true });
  const allowed = services.filter(
    (s) => !s.is_premium || auth.customer.is_premium
  );

  const selected = businessFilterServices(auth.business, serviceIds, allowed);
  const duration = calcDuration(auth.business, allowed, selected);

  const times = validateBookingTimes(auth.business, date, time, duration);
  if (times.error) return { error: times.error };
  const { startAt, endAt } = times;

  const free = await isSlotFree(auth.business, spaceId, startAt, endAt, date);
  if (!free) return { error: "Ese espacio ya no está disponible en ese horario." };

  const apt = await createAppointment({
    businessId: auth.business.id,
    customerId: auth.customer.id,
    spaceId,
    startAt,
    endAt,
    serviceIds: selected,
  });

  if (auth.business.notify_new_booking) {
    await createNotification({
      businessId: auth.business.id,
      recipientRole: "customer",
      recipientId: auth.customer.id,
      type: "booking",
      title: "Reserva confirmada",
      body: `Cita el ${formatDateShort(startAt)} de ${formatTime(startAt)} a ${formatTime(endAt)}.`,
    });
    const admins = await listAdmins(auth.business.id);
    for (const admin of admins) {
      await createNotification({
        businessId: auth.business.id,
        recipientRole: "admin",
        recipientId: admin.id,
        type: "booking",
        title: "Nueva reserva",
        body: `${auth.customer.name || auth.customer.phone} reservó el ${formatDateShort(startAt)} a las ${formatTime(startAt)}.`,
      });
    }
  }

  revalidatePath(`/b/${slug}/app`);
  redirect(`/b/${slug}/app?booked=1`);
}

export async function customerCancel(slug, appointmentId) {
  const auth = await guard(slug);
  if (auth.error) return { error: "No autorizado" };

  const appointments = await listCustomerAppointments(
    auth.customer.id,
    auth.business.id
  );
  const apt = appointments.find((a) => a.id === appointmentId);
  if (!apt || apt.status !== "active") return { error: "Reserva no encontrada." };

  const hoursLeft = (new Date(apt.start_at) - Date.now()) / (1000 * 60 * 60);
  if (hoursLeft < auth.business.min_modify_hours) {
    return {
      error: `Solo puedes modificar con al menos ${auth.business.min_modify_hours} horas de anticipación.`,
    };
  }

  await cancelAppointment(apt.id, auth.business.id, "customer");

  if (auth.business.notify_cancel_booking) {
    const admins = await listAdmins(auth.business.id);
    for (const admin of admins) {
      await createNotification({
        businessId: auth.business.id,
        recipientRole: "admin",
        recipientId: admin.id,
        type: "cancel",
        title: "Cliente canceló",
        body: `${auth.customer.name} canceló su cita del ${formatDateShort(apt.start_at)}.`,
      });
    }
  }

  revalidatePath(`/b/${slug}/app/reservations`);
  return { success: true };
}

export async function customerReschedule(slug, appointmentId, formData) {
  const auth = await guard(slug);
  if (auth.error) return { error: "No autorizado" };

  const appointments = await listCustomerAppointments(
    auth.customer.id,
    auth.business.id
  );
  const apt = appointments.find((a) => a.id === appointmentId);
  if (!apt || apt.status !== "active") return { error: "Reserva no encontrada." };

  const hoursLeft = (new Date(apt.start_at) - Date.now()) / (1000 * 60 * 60);
  if (hoursLeft < auth.business.min_modify_hours) {
    return {
      error: `Solo puedes modificar con al menos ${auth.business.min_modify_hours} horas de anticipación.`,
    };
  }

  const date = formData.get("date");
  const time = formData.get("time");
  const spaceId = formData.get("spaceId") || apt.space_id;
  const serviceIds = formData.getAll("serviceIds");

  const services = await listServices(auth.business.id, { activeOnly: true });
  const allowed = services.filter(
    (s) => !s.is_premium || auth.customer.is_premium
  );
  const selected = businessFilterServices(auth.business, serviceIds, allowed);
  const existingServices = apt.services?.map((s) => s.id) || [];
  const finalServices = selected.length ? selected : existingServices;
  const duration = calcDuration(auth.business, allowed, finalServices);

  const times = validateBookingTimes(auth.business, date, time, duration);
  if (times.error) return { error: times.error };
  const { startAt, endAt } = times;

  const free = await isSlotFree(
    auth.business,
    spaceId,
    startAt,
    endAt,
    date,
    apt.id
  );
  if (!free) return { error: "Ese horario no está disponible." };

  await updateAppointment(apt.id, auth.business.id, {
    startAt,
    endAt,
    serviceIds: finalServices,
  });

  revalidatePath(`/b/${slug}/app/reservations`);
  return { success: true };
}
