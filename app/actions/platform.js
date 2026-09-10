"use server";

import { requirePlatformAdminSession } from "@/lib/auth";
import { hashPassword, isPasswordStrongEnough, PASSWORD_MIN_LENGTH, verifyPassword } from "@/lib/password";
import {
  clearAdminPassword,
  createBusinessWithAdmin,
  createBusinessType,
  deleteBusinessType,
  getAdminByBusinessId,
  getBusinessById,
  getBusinessSlugExists,
  getBusinessTypeBySlug,
  setPlatformAdminPassword,
  updateBusinessTypeLabel,
  updatePlatformAdmin,
} from "@/lib/queries";
import { getSession, setSession } from "@/lib/session";
import { touchSessionTimestamps } from "@/lib/session-policy";
import { isValidSlug, normalizePhone, slugify, normalizeBusinessTime, parseBusinessMinutes } from "@/lib/utils";
import { isUniqueViolation } from "@/lib/pg-error";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function guard() {
  const session = await getSession({ touch: true });
  return requirePlatformAdminSession(session);
}

export async function platformCreateBusiness(formData) {
  const auth = await guard();
  if (auth.error) return { error: "No autorizado" };

  const name = String(formData.get("name") || "").trim();
  const slugInput = String(formData.get("slug") || "").trim();
  const businessType = String(formData.get("business_type") || "general");
  const adminName = String(formData.get("admin_name") || "").trim();
  const adminPhone = normalizePhone(formData.get("admin_phone"));
  const openHour = normalizeBusinessTime(formData.get("open_hour") || "09:00");
  const closeHour = normalizeBusinessTime(formData.get("close_hour") || "18:00");

  if (!name) return { error: "Ingresa el nombre del negocio." };
  if (!adminName) return { error: "Ingresa el nombre del administrador del negocio." };
  if (!adminPhone || adminPhone.length < 8) {
    return { error: "Ingresa un teléfono válido para el administrador." };
  }

  const slug = slugInput || slugify(name);
  if (!isValidSlug(slug)) {
    return { error: "El identificador (slug) solo puede tener letras minúsculas, números y guiones." };
  }

  if (await getBusinessSlugExists(slug)) {
    return { error: "Ese identificador ya está en uso. Elige otro." };
  }

  if (!/^\d{2}:\d{2}$/.test(openHour) || !/^\d{2}:\d{2}$/.test(closeHour)) {
    return { error: "Ingresa un horario de apertura y cierre válido." };
  }
  if (!(parseBusinessMinutes(closeHour) > parseBusinessMinutes(openHour))) {
    return { error: "La hora de cierre debe ser posterior a la de apertura." };
  }

  const typeExists = await getBusinessTypeBySlug(businessType);
  if (!typeExists) {
    return { error: "Selecciona un tipo de negocio válido." };
  }

  let business;
  try {
    business = await createBusinessWithAdmin(auth.session.userId, {
      slug,
      name,
      businessType,
      adminName,
      adminPhone,
      openHour,
      closeHour,
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { error: "Ese identificador ya está en uso. Elige otro." };
    }
    throw error;
  }

  revalidatePath("/platform");
  redirect(`/b/${business.slug}/admin`);
}

export async function platformUpdateProfile(formData) {
  const auth = await guard();
  if (auth.error) return { error: "No autorizado" };

  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Ingresa tu nombre." };

  await updatePlatformAdmin(auth.session.userId, { name });

  const session = await getSession();
  await setSession(touchSessionTimestamps({ ...session, name }));

  revalidatePath("/platform");
  revalidatePath("/platform/settings");
  return { success: true };
}

export async function platformChangePassword(formData) {
  const auth = await guard();
  if (auth.error) return { error: "No autorizado" };

  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (auth.platformAdmin.password_hash) {
    const valid = await verifyPassword(currentPassword, auth.platformAdmin.password_hash);
    if (!valid) return { error: "La contraseña actual no es correcta." };
  }
  if (!isPasswordStrongEnough(newPassword)) {
    return { error: `La nueva contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.` };
  }
  if (newPassword !== confirmPassword) {
    return { error: "Las contraseñas no coinciden." };
  }

  await setPlatformAdminPassword(auth.session.userId, await hashPassword(newPassword));
  return { success: true };
}

/** Forces a business admin to set a brand-new password the next time they log in. */
export async function platformResetAdminPassword(businessId) {
  const auth = await guard();
  if (auth.error) return { error: "No autorizado" };

  const business = await getBusinessById(businessId);
  if (!business || business.platform_admin_id !== auth.session.userId) {
    return { error: "No autorizado" };
  }

  const admin = await getAdminByBusinessId(businessId);
  if (!admin) return { error: "Este negocio no tiene administrador." };

  await clearAdminPassword(admin.id);
  revalidatePath("/platform");
  return { success: true };
}

export async function platformAddBusinessType(formData) {
  const auth = await guard();
  if (auth.error) return { error: "No autorizado" };

  const label = String(formData.get("label") || "").trim();
  if (!label) return { error: "Ingresa un nombre para el tipo." };

  const slug = slugify(label);
  if (!isValidSlug(slug)) {
    return { error: "No se pudo generar un identificador válido para ese nombre." };
  }

  if (await getBusinessTypeBySlug(slug)) {
    return { error: "Ya existe un tipo con ese nombre o identificador." };
  }

  const type = await createBusinessType({ slug, label });
  revalidatePath("/platform/settings");
  revalidatePath("/platform/businesses/new");
  return { type };
}

export async function platformUpdateBusinessType(id, label) {
  const auth = await guard();
  if (auth.error) return { error: "No autorizado" };

  const trimmed = String(label || "").trim();
  if (!trimmed) return { error: "El nombre no puede estar vacío." };

  await updateBusinessTypeLabel(id, trimmed);
  revalidatePath("/platform/settings");
  revalidatePath("/platform/businesses/new");
  revalidatePath("/platform");
  return { success: true };
}

export async function platformDeleteBusinessType(id) {
  const auth = await guard();
  if (auth.error) return { error: "No autorizado" };

  const result = await deleteBusinessType(id);
  if (result.error === "in_use") {
    return {
      error: `No se puede eliminar: ${result.count} negocio(s) usan este tipo.`,
    };
  }
  if (result.error) return { error: "No se pudo eliminar." };

  revalidatePath("/platform/settings");
  revalidatePath("/platform/businesses/new");
  revalidatePath("/platform");
  return { success: true };
}
