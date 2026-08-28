import {
  getBusinessBySlug,
  getAdminByPhone,
  getAdminByBusinessId,
  getCustomerByPhone,
  getPlatformAdminByPhone,
  getPlatformAdminById,
  findAccountsByPhone,
} from "./queries";
import { normalizePhone } from "./utils";

const AUTH_GENERIC_LOGIN_ERROR =
  "No se pudo iniciar sesión con ese teléfono. Si eres cliente, usa el enlace de invitación de tu negocio.";

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

export async function resolveUniversalLogin(phone, destinationKey = null) {
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

  if (account.role === "platform_admin") return loginPlatformAdmin(normalized);
  if (account.role === "admin") return loginAdmin(account.slug, normalized);
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

export async function loginPlatformAdmin(phone) {
  const normalized = normalizePhone(phone);
  const platformAdmin = await getPlatformAdminByPhone(normalized);
  if (!platformAdmin) {
    return { error: AUTH_GENERIC_LOGIN_ERROR };
  }

  return {
    session: {
      role: "platform_admin",
      userId: platformAdmin.id,
      phone: normalized,
      name: platformAdmin.name,
    },
  };
}

export async function loginAdmin(slug, phone) {
  const normalized = normalizePhone(phone);
  const business = await getBusinessBySlug(slug);
  if (!business) return { error: "Negocio no encontrado." };

  const admin = await getAdminByPhone(business.id, normalized);
  if (!admin) return { error: AUTH_GENERIC_LOGIN_ERROR };

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
