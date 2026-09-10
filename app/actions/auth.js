"use server";

import {
  checkAdminCredentials,
  checkPlatformAdminCredentials,
  loginCustomer,
  resolveUniversalLogin,
} from "@/lib/auth";
import {
  createCustomer,
  getCustomerByPhone,
  getInviteByToken,
} from "@/lib/queries";
import { setSession, clearSession } from "@/lib/session";
import { consumeAuthAttempt, AUTH_ATTEMPT_ERROR } from "@/lib/rate-limit";
import { safeRedirectPath } from "@/lib/safe-redirect";
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
    const password = formData.get("password") ? String(formData.get("password")) : null;
    const confirmPassword = formData.get("confirmPassword")
      ? String(formData.get("confirmPassword"))
      : null;

    const attemptKey = password
      ? `login-pwd:${destination || normalizePhone(phone)}`
      : `login:${normalizePhone(phone)}`;
    const allowed = await consumeAuthAttempt(attemptKey);
    if (!allowed) return { error: AUTH_ATTEMPT_ERROR };

    const result = await resolveUniversalLogin(phone, { destinationKey: destination, password, confirmPassword });
    if (result.destinations) return { destinations: result.destinations };
    if (result.needsSetup) return { needsSetup: true, error: result.error, destination: result.destination };
    if (result.needsPassword) return { needsPassword: true, error: result.error, destination: result.destination };
    if (result.error) return { error: result.error };
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
    const password = formData.get("password") ? String(formData.get("password")) : null;
    const confirmPassword = formData.get("confirmPassword")
      ? String(formData.get("confirmPassword"))
      : null;

    const attemptKey = password
      ? `login-pwd:platform:${normalizePhone(phone)}`
      : `login:${normalizePhone(phone)}`;
    const allowed = await consumeAuthAttempt(attemptKey);
    if (!allowed) return { error: AUTH_ATTEMPT_ERROR };

    const result = await checkPlatformAdminCredentials({ phone, password, confirmPassword });
    if (result.needsSetup) return { needsSetup: true, error: result.error };
    if (result.needsPassword) return { needsPassword: true, error: result.error };
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
    const password = formData.get("password") ? String(formData.get("password")) : null;
    const confirmPassword = formData.get("confirmPassword")
      ? String(formData.get("confirmPassword"))
      : null;

    const attemptKey = password
      ? `login-pwd:${slug}:${normalizePhone(phone)}`
      : `login:${slug}:${normalizePhone(phone)}`;
    const allowed = await consumeAuthAttempt(attemptKey);
    if (!allowed) return { error: AUTH_ATTEMPT_ERROR };

    const result = await checkAdminCredentials({ slug, phone, password, confirmPassword });
    if (result.needsSetup) return { needsSetup: true, error: result.error };
    if (result.needsPassword) return { needsPassword: true, error: result.error };
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
    const allowed = await consumeAuthAttempt(`login:${slug}:${normalizePhone(phone)}`);
    if (!allowed) return { error: AUTH_ATTEMPT_ERROR };
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
  try {
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

    const existing = await getCustomerByPhone(invite.business_id, phone);
    if (existing) {
      return {
        error:
          "Ya existe una cuenta con este teléfono. Inicia sesión en lugar de crear una nueva.",
      };
    }

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
  } catch (error) {
    unstable_rethrow(error);
    console.error("joinWithInviteAction", error);
    return { error: "No se pudo completar el registro. Intenta de nuevo." };
  }
}

export async function logoutAction(formData) {
  const redirectTo = safeRedirectPath(formData.get("redirectTo"), "/");
  await clearSession();

  const base = redirectTo.split("?")[0];
  if (!base.endsWith("/login")) {
    redirect(base);
  }

  const params = new URLSearchParams(redirectTo.includes("?") ? redirectTo.split("?")[1] : "");
  params.set("loggedOut", "1");
  redirect(`${base}?${params.toString()}`);
}
