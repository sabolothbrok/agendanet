"use server";

import { loginAdmin, loginCustomer, loginPlatformAdmin, resolveUniversalLogin } from "@/lib/auth";
import {
  createCustomer,
  getInviteByToken,
} from "@/lib/queries";
import { setSession, clearSession } from "@/lib/session";
import { normalizePhone } from "@/lib/utils";
import { redirect, unstable_rethrow } from "next/navigation";

function loginErrorMessage(error) {
  if (error instanceof Error && error.message.includes("Falta DATABASE_URL")) {
    return error.message;
  }
  return "Error al iniciar sesión. Verifica tu conexión e intenta de nuevo.";
}

export async function universalLoginAction(formData) {
  try {
    const phone = formData.get("phone");
    const destinationRaw = formData.get("destination");
    const destination = destinationRaw ? String(destinationRaw) : null;
    const result = await resolveUniversalLogin(phone, destination);
    if (result.error) return { error: result.error };
    if (result.destinations) return { destinations: result.destinations };
    if (!result.session) return { error: "No se pudo iniciar sesión." };

    await setSession(result.session);
    if (result.session.role === "platform_admin") redirect("/platform");
    if (result.session.role === "admin") redirect(`/b/${result.session.businessSlug}/admin`);
    redirect(`/b/${result.session.businessSlug}/app`);
  } catch (error) {
    unstable_rethrow(error);
    console.error("universalLoginAction", error);
    return { error: loginErrorMessage(error) };
  }
}

export async function platformLoginAction(formData) {
  try {
    const phone = formData.get("phone");
    const result = await loginPlatformAdmin(phone);
    if (result.error) return { error: result.error };
    await setSession(result.session);
    redirect("/platform");
  } catch (error) {
    unstable_rethrow(error);
    console.error("platformLoginAction", error);
    return { error: loginErrorMessage(error) };
  }
}

export async function adminLoginAction(slug, formData) {
  try {
    const phone = formData.get("phone");
    const result = await loginAdmin(slug, phone);
    if (result.error) return { error: result.error };
    await setSession(result.session);
    redirect(`/b/${slug}/admin`);
  } catch (error) {
    unstable_rethrow(error);
    console.error("adminLoginAction", error);
    return { error: loginErrorMessage(error) };
  }
}

export async function customerLoginAction(slug, formData) {
  try {
    const phone = formData.get("phone");
    const result = await loginCustomer(slug, phone);
    if (result.error) return { error: result.error };
    await setSession(result.session);
    redirect(`/b/${slug}/app`);
  } catch (error) {
    unstable_rethrow(error);
    console.error("customerLoginAction", error);
    return { error: loginErrorMessage(error) };
  }
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
