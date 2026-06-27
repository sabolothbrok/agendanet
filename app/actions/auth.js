"use server";

import { loginAdmin, loginCustomer, loginPlatformAdmin, resolveUniversalLogin } from "@/lib/auth";
import {
  createCustomer,
  getInviteByToken,
} from "@/lib/queries";
import { setSession, clearSession } from "@/lib/session";
import { normalizePhone } from "@/lib/utils";
import { redirect } from "next/navigation";

export async function universalLoginAction(formData) {
  const phone = formData.get("phone");
  const destination = formData.get("destination") || null;
  const result = await resolveUniversalLogin(phone, destination);
  if (result.error) return { error: result.error };
  if (result.destinations) return { destinations: result.destinations };

  await setSession(result.session);
  if (result.session.role === "platform_admin") redirect("/platform");
  if (result.session.role === "admin") redirect(`/b/${result.session.businessSlug}/admin`);
  redirect(`/b/${result.session.businessSlug}/app`);
}

export async function platformLoginAction(formData) {
  const phone = formData.get("phone");
  const result = await loginPlatformAdmin(phone);
  if (result.error) return { error: result.error };
  await setSession(result.session);
  redirect("/platform");
}

export async function adminLoginAction(slug, formData) {
  const phone = formData.get("phone");
  const result = await loginAdmin(slug, phone);
  if (result.error) return { error: result.error };
  await setSession(result.session);
  redirect(`/b/${slug}/admin`);
}

export async function customerLoginAction(slug, formData) {
  const phone = formData.get("phone");
  const result = await loginCustomer(slug, phone);
  if (result.error) return { error: result.error };
  await setSession(result.session);
  redirect(`/b/${slug}/app`);
}

export async function joinWithInviteAction(slug, token, formData) {
  const invite = await getInviteByToken(token);
  if (!invite || invite.slug !== slug) {
    return { error: "Enlace de invitación inválido o expirado." };
  }

  const phone = normalizePhone(formData.get("phone"));
  const name = String(formData.get("name") || "").trim();

  if (!phone || phone.length < 8) {
    return { error: "Ingresa un teléfono válido." };
  }
  if (!name) return { error: "Ingresa tu nombre." };

  const customer = await createCustomer({
    businessId: invite.business_id,
    phone,
    name,
  });

  await setSession({
    role: "customer",
    userId: customer.id,
    businessId: invite.business_id,
    businessSlug: slug,
    phone,
    name: customer.name,
  });

  redirect(`/b/${slug}/app`);
}

export async function logoutAction(formData) {
  const redirectTo = formData.get("redirectTo") || "/";
  await clearSession();
  redirect(redirectTo);
}
