import {
  getBusinessBySlug,
  getAdminByPhone,
  getAdminByBusinessId,
  getCustomerByPhone,
  getPlatformAdminByPhone,
  getPlatformAdminById,
  findAccountsByPhone,
  setAdminPassword,
  setPlatformAdminPassword,
} from "./queries";
import { hashPassword, verifyPassword, isPasswordStrongEnough, PASSWORD_MIN_LENGTH } from "./password";
import { normalizePhone } from "./utils";

const AUTH_GENERIC_LOGIN_ERROR =
  "No se pudo iniciar sesión con ese teléfono. Si eres cliente, usa el enlace de invitación de tu negocio.";

const WEAK_PASSWORD_ERROR = `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`;
const PASSWORD_MISMATCH_ERROR = "Las contraseñas no coinciden.";
const WRONG_PASSWORD_ERROR = "Teléfono o contraseña incorrectos.";

function accountDestinationKey(account) {
  return `${account.role}:${account.slug || ""}`;
}

function formatLoginDestination(account) {
  if (account.role === "platform_admin") {
    return {
      key: accountDestinationKey(account),
      role: account.role,
      title: "Administrador general",
      subtitle: "Mis negocios",
    };
  }
  if (account.role === "admin") {
    return {
      key: accountDestinationKey(account),
      role: account.role,
      title: account.businessName,
      subtitle: "Panel del negocio",
    };
  }
  return {
    key: accountDestinationKey(account),
    role: account.role,
    title: account.businessName,
    subtitle: "App de cliente",
  };
}

/**
 * Verifies (or, the first time, establishes) the password for an account that
 * already has an id, name, and password_hash column. Shared by the admin and
 * platform-admin credential checks below since the state machine is identical.
 */
async function checkPassword({ passwordHash, password, confirmPassword, savePassword }) {
  if (!passwordHash) {
    if (!password) return { needsSetup: true };
    if (!isPasswordStrongEnough(password)) {
      return { needsSetup: true, error: WEAK_PASSWORD_ERROR };
    }
    if (password !== confirmPassword) {
      return { needsSetup: true, error: PASSWORD_MISMATCH_ERROR };
    }
    await savePassword(await hashPassword(password));
    return { ok: true };
  }

  if (!password) return { needsPassword: true };
  const valid = await verifyPassword(password, passwordHash);
  if (!valid) return { needsPassword: true, error: WRONG_PASSWORD_ERROR };
  return { ok: true };
}

export async function resolveUniversalLogin(phone, { destinationKey, password, confirmPassword } = {}) {
  const normalized = normalizePhone(phone);
  if (!normalized || normalized.length < 8) {
    return { error: "Ingresa un teléfono válido." };
  }

  const accounts = await findAccountsByPhone(normalized);
  if (accounts.length === 0) {
    return { error: AUTH_GENERIC_LOGIN_ERROR };
  }

  let account = accounts[0];
  if (destinationKey) {
    account = accounts.find((item) => accountDestinationKey(item) === destinationKey);
    if (!account) return { error: "Selecciona una cuenta válida." };
  } else if (accounts.length > 1) {
    return { destinations: accounts.map(formatLoginDestination) };
  }

  const destination = accountDestinationKey(account);

  if (account.role === "platform_admin") {
    const result = await checkPlatformAdminCredentials({ phone: normalized, password, confirmPassword });
    return { ...result, destination };
  }
  if (account.role === "admin") {
    const result = await checkAdminCredentials({
      slug: account.slug,
      phone: normalized,
      password,
      confirmPassword,
    });
    return { ...result, destination };
  }
  return loginCustomer(account.slug, normalized);
}

export async function requirePlatformAdminSession(session) {
  if (!session || session.role !== "platform_admin" || !session.userId) {
    return { error: "unauthorized" };
  }
  const platformAdmin = await getPlatformAdminById(session.userId);
  if (!platformAdmin || platformAdmin.phone !== session.phone) {
    return { error: "unauthorized" };
  }
  return { session, platformAdmin };
}

export async function requireAdminSession(session, slug) {
  const business = await getBusinessBySlug(slug);
  if (!business) return { error: "unauthorized" };

  if (session?.role === "platform_admin") {
    if (business.platform_admin_id !== session.userId) {
      return { error: "unauthorized" };
    }
    const businessAdmin = await getAdminByBusinessId(business.id);
    return {
      business,
      session,
      isPlatformAdmin: true,
      adminUserId: businessAdmin?.id,
      admin: businessAdmin,
    };
  }

  if (!session || session.role !== "admin" || session.businessSlug !== slug) {
    return { error: "unauthorized" };
  }
  if (business.id !== session.businessId) {
    return { error: "unauthorized" };
  }
  const admin = await getAdminByPhone(business.id, session.phone);
  if (!admin || admin.id !== session.userId) {
    return { error: "unauthorized" };
  }
  return {
    business,
    session,
    isPlatformAdmin: false,
    adminUserId: admin.id,
    admin,
  };
}

export async function requireCustomerSession(session, slug) {
  if (!session || session.role !== "customer" || session.businessSlug !== slug) {
    return { error: "unauthorized" };
  }
  const business = await getBusinessBySlug(slug);
  if (!business || business.id !== session.businessId) {
    return { error: "unauthorized" };
  }
  const customer = await getCustomerByPhone(business.id, session.phone);
  if (!customer || customer.id !== session.userId) return { error: "unauthorized" };
  return { business, customer, session };
}

/**
 * Checks (or, on a fresh account, sets) a platform admin's password.
 * Returns one of:
 *  - { error } — phone not found, or a validation/verification failure
 *  - { needsSetup: true, error? } — account has no password yet; show the create-password step
 *  - { needsPassword: true, error? } — account has a password; show the password field
 *  - { session } — credentials verified (or just set); caller should establish the session
 */
export async function checkPlatformAdminCredentials({ phone, password, confirmPassword }) {
  const normalized = normalizePhone(phone);
  const platformAdmin = await getPlatformAdminByPhone(normalized);
  if (!platformAdmin) return { error: AUTH_GENERIC_LOGIN_ERROR };

  const result = await checkPassword({
    passwordHash: platformAdmin.password_hash,
    password,
    confirmPassword,
    savePassword: (hash) => setPlatformAdminPassword(platformAdmin.id, hash),
  });
  if (!result.ok) return result;

  return {
    session: {
      role: "platform_admin",
      userId: platformAdmin.id,
      phone: normalized,
      name: platformAdmin.name,
    },
  };
}

/** Same contract as checkPlatformAdminCredentials, scoped to one business's admin. */
export async function checkAdminCredentials({ slug, phone, password, confirmPassword }) {
  const normalized = normalizePhone(phone);
  const business = await getBusinessBySlug(slug);
  if (!business) return { error: "Negocio no encontrado." };

  const admin = await getAdminByPhone(business.id, normalized);
  if (!admin) return { error: AUTH_GENERIC_LOGIN_ERROR };

  const result = await checkPassword({
    passwordHash: admin.password_hash,
    password,
    confirmPassword,
    savePassword: (hash) => setAdminPassword(admin.id, hash),
  });
  if (!result.ok) return result;

  return {
    session: {
      role: "admin",
      userId: admin.id,
      businessId: business.id,
      businessSlug: slug,
      phone: normalized,
      name: admin.name,
    },
  };
}

export async function loginCustomer(slug, phone) {
  const normalized = normalizePhone(phone);
  const business = await getBusinessBySlug(slug);
  if (!business) return { error: "Negocio no encontrado." };

  const customer = await getCustomerByPhone(business.id, normalized);
  if (!customer) return { error: AUTH_GENERIC_LOGIN_ERROR };

  return {
    session: {
      role: "customer",
      userId: customer.id,
      businessId: business.id,
      businessSlug: slug,
      phone: normalized,
      name: customer.name,
    },
  };
}
