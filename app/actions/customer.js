"use server";

import { requireCustomerSession } from "@/lib/auth";
import {
  createAppointment,
  createNotification,
  cancelAppointment,
  updateAppointment,
  getCalendarData,
  getActiveSpace,
  listAdmins,
  listServices,
  listCustomerAppointments,
  customerHasOverlappingRequest,
  rejectOverlappingPending,
} from "@/lib/queries";
import { getSession } from "@/lib/session";
import {
  addMinutes,
  combineDateAndTime,
  formatDateShort,
  formatTime,
  fitsWithinBusinessHours,
  isSlotBookable,
  isSlotStartInPast,
  resolveHours,
} from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function guard(slug) {
  const session = await getSession({ touch: true });
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

async function isSlotFree(business, spaceId, time, dateStr, duration, excludeId = null) {
  const { appointments, blocks } = await getCalendarData(business.id, dateStr);
  const hours = resolveHours(business, dateStr);
  if (hours.isClosed) return false;

  return isSlotBookable({
    spaceId,
    time,
    dateStr,
    duration,
    openHour: hours.openHour,
    closeHour: hours.closeHour,
    appointments,
    blocks,
    excludeAppointmentId: excludeId,
  });
}

function validateBookingTimes(business, date, time, duration) {
  const hours = resolveHours(business, date);
  if (hours.isClosed) {
    return { error: "El negocio no atiende este día." };
  }

  if (isSlotStartInPast(date, time)) {
    return { error: "Ese horario ya pasó." };
  }

  const startAt = combineDateAndTime(date, time);
  const endAt = addMinutes(startAt, duration);

  if (!fitsWithinBusinessHours(startAt, endAt, hours.openHour, hours.closeHour, date)) {
    return {
      error: `La reserva termina después del horario de cierre (${hours.closeHour}).`,
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

  const space = await getActiveSpace(auth.business.id, spaceId);
  if (!space) return { error: "Espacio inválido." };

  const times = validateBookingTimes(auth.business, date, time, duration);
  if (times.error) return { error: times.error };
  const { startAt, endAt } = times;

  const free = await isSlotFree(auth.business, space.id, time, date, duration);
  if (!free) return { error: "Ese espacio ya no está disponible en ese horario." };

  const overlappingOwn = await customerHasOverlappingRequest({
    customerId: auth.customer.id,
    spaceId: space.id,
    startAt,
    endAt,
  });
  if (overlappingOwn) {
    return { error: "Ya tienes una reserva o solicitud en ese espacio y horario." };
  }

  const needsApproval = Boolean(auth.business.require_booking_approval);
  const apt = await createAppointment({
    businessId: auth.business.id,
    customerId: auth.customer.id,
    spaceId: space.id,
    startAt,
    endAt,
    serviceIds: selected,
    status: needsApproval ? "pending" : "active",
  });
  if (!apt) return { error: "Ese espacio ya no está disponible en ese horario." };

  if (!needsApproval) {
    await rejectOverlappingPending({
      businessId: auth.business.id,
      spaceId: space.id,
      startAt,
      endAt,
      excludeId: apt.id,
    });
  }

  if (auth.business.notify_new_booking) {
    const admins = await listAdmins(auth.business.id);
    for (const admin of admins) {
      await createNotification({
        businessId: auth.business.id,
        recipientRole: "admin",
        recipientId: admin.id,
        type: "booking",
        title: needsApproval ? "Nueva solicitud de reserva" : "Nueva reserva",
        body: needsApproval
          ? `${auth.customer.name || auth.customer.phone} solicitó el ${formatDateShort(startAt)} a las ${formatTime(startAt)}. Pendiente de aprobación.`
          : `${auth.customer.name || auth.customer.phone} reservó el ${formatDateShort(startAt)} a las ${formatTime(startAt)}.`,
      });
    }
  }

  revalidatePath(`/b/${slug}/app`);
  revalidatePath(`/b/${slug}/admin`);
  revalidatePath(`/b/${slug}/admin/calendar`);
  redirect(`/b/${slug}/app?booked=${needsApproval ? "pending" : "1"}`);
}

export async function customerCancel(slug, appointmentId) {
  const auth = await guard(slug);
  if (auth.error) return { error: "No autorizado" };

  const appointments = await listCustomerAppointments(
    auth.customer.id,
    auth.business.id
  );
  const apt = appointments.find((a) => a.id === appointmentId);
  if (!apt || !["active", "pending"].includes(apt.status)) {
    return { error: "Reserva no encontrada." };
  }

  if (apt.status === "active") {
    const hoursLeft = (new Date(apt.start_at) - Date.now()) / (1000 * 60 * 60);
    if (hoursLeft < auth.business.min_modify_hours) {
      return {
        error: `Solo puedes modificar con al menos ${auth.business.min_modify_hours} horas de anticipación.`,
      };
    }
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
  revalidatePath(`/b/${slug}/admin`);
  revalidatePath(`/b/${slug}/admin/calendar`);
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
  if (!apt || !["active", "pending"].includes(apt.status)) {
    return { error: "Reserva no encontrada." };
  }

  if (apt.status === "active") {
    const hoursLeft = (new Date(apt.start_at) - Date.now()) / (1000 * 60 * 60);
    if (hoursLeft < auth.business.min_modify_hours) {
      return {
        error: `Solo puedes modificar con al menos ${auth.business.min_modify_hours} horas de anticipación.`,
      };
    }
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

  const space = await getActiveSpace(auth.business.id, spaceId);
  if (!space) return { error: "Espacio inválido." };

  const times = validateBookingTimes(auth.business, date, time, duration);
  if (times.error) return { error: times.error };
  const { startAt, endAt } = times;

  const free = await isSlotFree(
    auth.business,
    space.id,
    time,
    date,
    duration,
    apt.id
  );
  if (!free) return { error: "Ese horario no está disponible." };

  const overlappingOwn = await customerHasOverlappingRequest({
    customerId: auth.customer.id,
    spaceId: space.id,
    startAt,
    endAt,
    excludeId: apt.id,
  });
  if (overlappingOwn) {
    return { error: "Ya tienes una reserva o solicitud en ese espacio y horario." };
  }

  const updated = await updateAppointment(apt.id, auth.business.id, {
    startAt,
    endAt,
    serviceIds: finalServices,
  });
  if (!updated) return { error: "Ese horario no está disponible." };

  if (apt.status === "active") {
    await rejectOverlappingPending({
      businessId: auth.business.id,
      spaceId: space.id,
      startAt,
      endAt,
      excludeId: apt.id,
    });
  }

  revalidatePath(`/b/${slug}/app/reservations`);
  revalidatePath(`/b/${slug}/admin`);
  revalidatePath(`/b/${slug}/admin/calendar`);
  return { success: true };
}
