import {
  getBusinessBySlug,
  getAdminByPhone,
  getAdminByBusinessId,
  getCustomerByPhone,
  getPlatformAdminByPhone,
} from "./queries";
import { normalizePhone } from "./utils";

export async function requirePlatformAdminSession(session) {
  if (!session || session.role !== "platform_admin") {
    return { error: "unauthorized" };
  }
  return { session, platformAdmin: session };
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
  return {
    business,
    session,
    isPlatformAdmin: false,
    adminUserId: session.userId,
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
  if (!customer) return { error: "unauthorized" };
  return { business, customer, session };
}

export async function loginPlatformAdmin(phone) {
  const normalized = normalizePhone(phone);
  const platformAdmin = await getPlatformAdminByPhone(normalized);
  if (!platformAdmin) {
    return { error: "Teléfono no autorizado como administrador general." };
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
  if (!admin) return { error: "Teléfono no autorizado como administrador." };

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
  if (!customer) return { error: "No tienes acceso. Usa el enlace de invitación del negocio." };

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
