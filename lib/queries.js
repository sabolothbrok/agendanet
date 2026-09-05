import { getSql } from "./db";
import {
  INVITE_TTL_MINUTES,
  CLIENT_HISTORY_LIMIT,
} from "./constants";
import { isExclusionViolation } from "./pg-error";
import {
  formatWeekRange,
  getCalendarDayBounds,
  getWeekDates,
  parseBusinessMinutes,
  resolveHours,
  toDateInputStr,
} from "./utils";

const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

async function listWeeklyHours(businessId) {
  const sql = getSql();
  return sql`
    SELECT weekday, is_open, open_hour, close_hour
    FROM business_weekly_hours
    WHERE business_id = ${businessId}
    ORDER BY weekday
  `;
}

async function withWeeklyHours(business) {
  if (!business) return null;
  const rows = await listWeeklyHours(business.id);
  return {
    ...business,
    use_custom_weekly_hours: Boolean(business.use_custom_weekly_hours),
    weeklyHours: rows.map((row) => ({
      weekday: Number(row.weekday),
      is_open: Boolean(row.is_open),
      open_hour: String(row.open_hour).slice(0, 5),
      close_hour: String(row.close_hour).slice(0, 5),
    })),
  };
}

export async function getBusinessBySlug(slug) {
  const sql = getSql();
  const rows = await sql`
    SELECT b.*, s.min_modify_hours, s.min_appointment_minutes, s.show_services_list,
           s.reminders_enabled, s.notify_inactive_enabled, s.notify_inactive_days,
           s.notify_new_booking, s.notify_cancel_booking, s.require_booking_approval,
           s.use_custom_weekly_hours
    FROM businesses b
    JOIN business_settings s ON s.business_id = b.id
    WHERE b.slug = ${slug}
    LIMIT 1
  `;
  return withWeeklyHours(rows[0] || null);
}

export async function getBusinessById(id) {
  const sql = getSql();
  const rows = await sql`
    SELECT b.*, s.min_modify_hours, s.min_appointment_minutes, s.show_services_list,
           s.reminders_enabled, s.notify_inactive_enabled, s.notify_inactive_days,
           s.notify_new_booking, s.notify_cancel_booking, s.require_booking_approval,
           s.use_custom_weekly_hours
    FROM businesses b
    JOIN business_settings s ON s.business_id = b.id
    WHERE b.id = ${id}
    LIMIT 1
  `;
  return withWeeklyHours(rows[0] || null);
}

export async function listBusinesses() {
  const sql = getSql();
  return sql`
    SELECT b.id, b.slug, b.name, b.business_type,
      COALESCE(bt.label, b.business_type) AS business_type_label
    FROM businesses b
    LEFT JOIN business_types bt ON bt.slug = b.business_type
    ORDER BY b.name
  `;
}

export async function listBusinessesByPlatformAdmin(platformAdminId) {
  const sql = getSql();
  return sql`
    SELECT b.id, b.slug, b.name, b.business_type, b.created_at,
      COALESCE(bt.label, b.business_type) AS business_type_label,
      a.phone AS admin_phone, a.name AS admin_name
    FROM businesses b
    LEFT JOIN business_types bt ON bt.slug = b.business_type
    LEFT JOIN admins a ON a.business_id = b.id
    WHERE b.platform_admin_id = ${platformAdminId}
    ORDER BY b.name
  `;
}

export async function listBusinessTypes() {
  const sql = getSql();
  return sql`
    SELECT * FROM business_types ORDER BY sort_order, label
  `;
}

export async function getBusinessTypeBySlug(slug) {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM business_types WHERE slug = ${slug} LIMIT 1
  `;
  return rows[0] || null;
}

export async function createBusinessType({ slug, label }) {
  const sql = getSql();
  const [{ max_order }] = await sql`
    SELECT COALESCE(MAX(sort_order), 0)::int AS max_order FROM business_types
  `;
  const rows = await sql`
    INSERT INTO business_types (slug, label, sort_order)
    VALUES (${slug}, ${label}, ${max_order + 1})
    RETURNING *
  `;
  return rows[0];
}

export async function updateBusinessTypeLabel(id, label) {
  const sql = getSql();
  const rows = await sql`
    UPDATE business_types SET label = ${label}
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0];
}

export async function countBusinessesByType(slug) {
  const sql = getSql();
  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM businesses WHERE business_type = ${slug}
  `;
  return count;
}

export async function deleteBusinessType(id) {
  const sql = getSql();
  const rows = await sql`SELECT slug FROM business_types WHERE id = ${id}`;
  const type = rows[0];
  if (!type) return { error: "not_found" };

  const count = await countBusinessesByType(type.slug);
  if (count > 0) {
    return { error: "in_use", slug: type.slug, count };
  }

  await sql`DELETE FROM business_types WHERE id = ${id}`;
  return { deleted: true };
}

export async function getPlatformAdminByPhone(phone) {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM platform_admins WHERE phone = ${phone} LIMIT 1
  `;
  return rows[0] || null;
}

export async function findAccountsByPhone(phone) {
  const sql = getSql();
  const accounts = [];

  const platformAdmin = await getPlatformAdminByPhone(phone);
  if (platformAdmin) {
    accounts.push({
      role: "platform_admin",
      userId: platformAdmin.id,
      name: platformAdmin.name,
      slug: null,
      businessName: null,
    });
  }

  const admins = await sql`
    SELECT a.id, a.name, b.slug, b.name AS business_name
    FROM admins a
    JOIN businesses b ON b.id = a.business_id
    WHERE a.phone = ${phone}
    ORDER BY b.name
  `;
  for (const row of admins) {
    accounts.push({
      role: "admin",
      userId: row.id,
      name: row.name,
      slug: row.slug,
      businessName: row.business_name,
    });
  }

  const customers = await sql`
    SELECT c.id, c.name, b.slug, b.name AS business_name
    FROM customers c
    JOIN businesses b ON b.id = c.business_id
    WHERE c.phone = ${phone} AND c.deleted_at IS NULL
    ORDER BY b.name
  `;
  for (const row of customers) {
    accounts.push({
      role: "customer",
      userId: row.id,
      name: row.name,
      slug: row.slug,
      businessName: row.business_name,
    });
  }

  return accounts;
}

export async function getPlatformAdminById(id) {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM platform_admins WHERE id = ${id} LIMIT 1
  `;
  return rows[0] || null;
}

export async function updatePlatformAdmin(id, { name }) {
  const sql = getSql();
  const rows = await sql`
    UPDATE platform_admins SET name = ${name}
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0];
}

export async function getBusinessSlugExists(slug) {
  const sql = getSql();
  const rows = await sql`
    SELECT 1 FROM businesses WHERE slug = ${slug} LIMIT 1
  `;
  return rows.length > 0;
}

export async function createBusinessWithAdmin(platformAdminId, data) {
  const sql = getSql();

  const businessRows = await sql`
    INSERT INTO businesses (
      platform_admin_id, slug, name, business_type, open_hour, close_hour, slot_minutes
    )
    VALUES (
      ${platformAdminId},
      ${data.slug},
      ${data.name},
      ${data.businessType},
      ${data.openHour},
      ${data.closeHour},
      ${data.slotMinutes ?? 30}
    )
    RETURNING *
  `;
  const business = businessRows[0];

  await sql`
    INSERT INTO business_settings (business_id) VALUES (${business.id})
  `;

  await sql`
    INSERT INTO admins (business_id, phone, name)
    VALUES (${business.id}, ${data.adminPhone}, ${data.adminName})
  `;

  await sql`
    INSERT INTO spaces (business_id, name, sort_order)
    VALUES (${business.id}, 'Estación 1', 1)
  `;

  return business;
}

export async function getAdminByPhone(businessId, phone) {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM admins WHERE business_id = ${businessId} AND phone = ${phone} LIMIT 1
  `;
  return rows[0] || null;
}

export async function getAdminByBusinessId(businessId) {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM admins WHERE business_id = ${businessId} LIMIT 1
  `;
  return rows[0] || null;
}

export async function getCustomerByPhone(businessId, phone) {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM customers
    WHERE business_id = ${businessId} AND phone = ${phone} AND deleted_at IS NULL
    LIMIT 1
  `;
  return rows[0] || null;
}

export async function getInviteByToken(token) {
  const sql = getSql();
  const rows = await sql`
    SELECT il.*, b.slug, b.name AS business_name
    FROM invite_links il
    JOIN businesses b ON b.id = il.business_id
    WHERE il.token = ${token}
      AND il.expires_at > NOW()
    LIMIT 1
  `;
  return rows[0] || null;
}

export async function createInviteLink(businessId) {
  const sql = getSql();
  const expiresAt = new Date(Date.now() + INVITE_TTL_MINUTES * 60 * 1000);

  await sql`
    DELETE FROM invite_links
    WHERE business_id = ${businessId} AND expires_at <= NOW()
  `;

  const rows = await sql`
    INSERT INTO invite_links (business_id, expires_at)
    VALUES (${businessId}, ${expiresAt.toISOString()})
    RETURNING token, expires_at AS "expiresAt"
  `;
  return rows[0];
}

export async function createCustomer({ businessId, phone, name }) {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO customers (business_id, phone, name)
    VALUES (${businessId}, ${phone}, ${name})
    ON CONFLICT (business_id, phone) DO UPDATE
      SET name = EXCLUDED.name, deleted_at = NULL
    RETURNING *
  `;
  return rows[0];
}

export async function listCustomers(businessId) {
  const sql = getSql();
  return sql`
    SELECT c.*,
      (SELECT MAX(a.start_at) FROM appointments a
       WHERE a.customer_id = c.id AND a.status IN ('active', 'completed')) AS last_appointment
    FROM customers c
    WHERE c.business_id = ${businessId} AND c.deleted_at IS NULL
    ORDER BY c.created_at DESC
  `;
}

export async function searchCustomers(businessId, query, limit = 5) {
  const sql = getSql();
  const like = `%${query}%`;
  return sql`
    SELECT id, name, phone
    FROM customers
    WHERE business_id = ${businessId}
      AND deleted_at IS NULL
      AND (name ILIKE ${like} OR phone ILIKE ${like})
    ORDER BY name ASC
    LIMIT ${limit}
  `;
}

export async function deleteCustomer(customerId, businessId) {
  const sql = getSql();
  const rows = await sql`
    SELECT id, name, phone FROM customers
    WHERE id = ${customerId} AND business_id = ${businessId} AND deleted_at IS NULL
    LIMIT 1
  `;
  const customer = rows[0];
  if (!customer) return null;

  await sql`
    DELETE FROM appointments
    WHERE customer_id = ${customerId} AND business_id = ${businessId}
  `;

  await sql`
    DELETE FROM notifications
    WHERE business_id = ${businessId}
      AND recipient_role = 'customer'
      AND recipient_id = ${customerId}
  `;

  const name = String(customer.name || "").trim();
  const phone = String(customer.phone || "").trim();
  await sql`
    DELETE FROM notifications
    WHERE business_id = ${businessId}
      AND recipient_role = 'admin'
      AND (
        (${phone} <> '' AND body LIKE ${"%" + phone + "%"})
        OR (${name} <> '' AND (
          body LIKE ${name + " reservó%"}
          OR body LIKE ${name + " solicitó%"}
          OR body LIKE ${name + " canceló%"}
        ))
      )
  `;

  await sql`
    UPDATE customers SET deleted_at = NOW()
    WHERE id = ${customerId} AND business_id = ${businessId}
  `;

  return customer;
}

export async function toggleCustomerPremium(customerId, businessId, isPremium) {
  const sql = getSql();
  await sql`
    UPDATE customers SET is_premium = ${isPremium}
    WHERE id = ${customerId} AND business_id = ${businessId}
  `;
}

export async function listServices(businessId, { activeOnly = false } = {}) {
  const sql = getSql();
  if (activeOnly) {
    return sql`
      SELECT * FROM services WHERE business_id = ${businessId} AND is_active = TRUE
      ORDER BY name
    `;
  }
  return sql`
    SELECT * FROM services WHERE business_id = ${businessId} ORDER BY name
  `;
}

export async function upsertService(businessId, data) {
  const sql = getSql();
  if (data.id) {
    const rows = await sql`
      UPDATE services SET
        name = ${data.name},
        duration_minutes = ${data.duration_minutes},
        price = ${data.price},
        is_premium = ${data.is_premium},
        is_active = ${data.is_active}
      WHERE id = ${data.id} AND business_id = ${businessId}
      RETURNING *
    `;
    return rows[0];
  }
  const rows = await sql`
    INSERT INTO services (business_id, name, duration_minutes, price, is_premium, is_active)
    VALUES (${businessId}, ${data.name}, ${data.duration_minutes}, ${data.price}, ${data.is_premium}, ${data.is_active ?? true})
    RETURNING *
  `;
  return rows[0];
}

export async function deleteService(serviceId, businessId) {
  const sql = getSql();
  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count
    FROM appointment_services aps
    JOIN appointments a ON a.id = aps.appointment_id
    WHERE aps.service_id = ${serviceId} AND a.business_id = ${businessId}
  `;
  if (count > 0) {
    await sql`
      UPDATE services SET is_active = FALSE
      WHERE id = ${serviceId} AND business_id = ${businessId}
    `;
    return { deactivated: true };
  }
  await sql`
    DELETE FROM services WHERE id = ${serviceId} AND business_id = ${businessId}
  `;
  return { deleted: true };
}

export async function listSpaces(businessId) {
  const sql = getSql();
  return sql`
    SELECT * FROM spaces WHERE business_id = ${businessId} AND is_active = TRUE
    ORDER BY sort_order, name
  `;
}

export async function listAllSpaces(businessId) {
  const sql = getSql();
  return sql`
    SELECT * FROM spaces WHERE business_id = ${businessId}
    ORDER BY sort_order, name
  `;
}

export async function spaceHasFutureAppointments(spaceId) {
  const sql = getSql();
  const rows = await sql`
    SELECT 1 FROM appointments
    WHERE space_id = ${spaceId} AND status IN ('active', 'pending') AND start_at > NOW()
    LIMIT 1
  `;
  return rows.length > 0;
}

export async function createSpace(businessId, name) {
  const sql = getSql();
  const [{ max_order }] = await sql`
    SELECT COALESCE(MAX(sort_order), 0)::int AS max_order
    FROM spaces WHERE business_id = ${businessId}
  `;
  const rows = await sql`
    INSERT INTO spaces (business_id, name, sort_order)
    VALUES (${businessId}, ${name}, ${max_order + 1})
    RETURNING *
  `;
  return rows[0];
}

export async function updateSpaceName(spaceId, businessId, name) {
  const sql = getSql();
  await sql`
    UPDATE spaces SET name = ${name.trim()}
    WHERE id = ${spaceId} AND business_id = ${businessId}
  `;
}

export async function syncSpaceCount(businessId, targetCount) {
  const sql = getSql();
  const count = Math.max(1, Math.min(20, targetCount));
  const all = await listAllSpaces(businessId);
  const active = all.filter((s) => s.is_active);
  const inactive = all.filter((s) => !s.is_active);
  const current = active.length;

  if (count > current) {
    let needed = count - current;
    const toReactivate = inactive
      .sort((a, b) => a.sort_order - b.sort_order)
      .slice(0, needed);
    for (const space of toReactivate) {
      await sql`UPDATE spaces SET is_active = TRUE WHERE id = ${space.id}`;
      needed--;
    }
    let nextNum = all.length + 1;
    for (let i = 0; i < needed; i++) {
      await createSpace(businessId, `Estación ${nextNum++}`);
    }
  } else if (count < current) {
    const toRemove = active
      .sort((a, b) => b.sort_order - a.sort_order)
      .slice(0, current - count);
    for (const space of toRemove) {
      if (await spaceHasFutureAppointments(space.id)) {
        return { error: `No se puede quitar "${space.name}" porque tiene citas futuras.` };
      }
      await sql`UPDATE spaces SET is_active = FALSE WHERE id = ${space.id}`;
    }
  }

  return { success: true };
}

export async function getActiveSpace(businessId, spaceId) {
  if (!spaceId) return null;
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM spaces
    WHERE id = ${spaceId} AND business_id = ${businessId} AND is_active = TRUE
    LIMIT 1
  `;
  return rows[0] || null;
}

export async function reconcileAppointmentStatuses(businessId = null) {
  const sql = getSql();
  if (businessId) {
    await sql`
      UPDATE appointments
      SET status = 'completed', updated_at = NOW()
      WHERE business_id = ${businessId} AND status = 'active' AND end_at <= NOW()
    `;
    await sql`
      UPDATE appointments
      SET status = 'cancelled', cancelled_by = 'expired', updated_at = NOW()
      WHERE business_id = ${businessId} AND status = 'pending' AND start_at <= NOW()
    `;
    return;
  }
  await sql`
    UPDATE appointments
    SET status = 'completed', updated_at = NOW()
    WHERE status = 'active' AND end_at <= NOW()
  `;
  await sql`
    UPDATE appointments
    SET status = 'cancelled', cancelled_by = 'expired', updated_at = NOW()
    WHERE status = 'pending' AND start_at <= NOW()
  `;
}

export async function getCalendarData(businessId, dateStr, { viewerCustomerId = null, includePending = false } = {}) {
  await reconcileAppointmentStatuses(businessId);
  const sql = getSql();
  const { start: dayStart, end: dayEnd } = getCalendarDayBounds(dateStr);

  const [spaces, rows, blocks] = await Promise.all([
    listSpaces(businessId),
    includePending
      ? sql`
          SELECT a.*, c.name AS customer_name, c.phone AS customer_phone,
            s.name AS space_name
          FROM appointments a
          JOIN customers c ON c.id = a.customer_id
          JOIN spaces s ON s.id = a.space_id
          WHERE a.business_id = ${businessId}
            AND a.status IN ('active', 'pending')
            AND a.start_at < ${dayEnd}
            AND a.end_at > ${dayStart}
          ORDER BY a.start_at
        `
      : viewerCustomerId
        ? sql`
            SELECT a.*, c.name AS customer_name, c.phone AS customer_phone,
              s.name AS space_name
            FROM appointments a
            JOIN customers c ON c.id = a.customer_id
            JOIN spaces s ON s.id = a.space_id
            WHERE a.business_id = ${businessId}
              AND (
                a.status = 'active'
                OR (a.status = 'pending' AND a.customer_id = ${viewerCustomerId})
              )
              AND a.start_at < ${dayEnd}
              AND a.end_at > ${dayStart}
            ORDER BY a.start_at
          `
        : sql`
            SELECT a.*, c.name AS customer_name, c.phone AS customer_phone,
              s.name AS space_name
            FROM appointments a
            JOIN customers c ON c.id = a.customer_id
            JOIN spaces s ON s.id = a.space_id
            WHERE a.business_id = ${businessId}
              AND a.status = 'active'
              AND a.start_at < ${dayEnd}
              AND a.end_at > ${dayStart}
            ORDER BY a.start_at
          `,
    sql`
      SELECT sb.*, sp.name AS space_name
      FROM space_blocks sb
      JOIN spaces sp ON sp.id = sb.space_id
      WHERE sp.business_id = ${businessId}
        AND sb.start_at < ${dayEnd}
        AND sb.end_at > ${dayStart}
    `,
  ]);

  const appointments = rows.map((apt) => {
    const isMine = viewerCustomerId && apt.customer_id === viewerCustomerId;
    if (!viewerCustomerId || isMine) {
      return { ...apt, is_mine: Boolean(isMine) };
    }
    return {
      id: apt.id,
      space_id: apt.space_id,
      start_at: apt.start_at,
      end_at: apt.end_at,
      status: apt.status,
      space_name: apt.space_name,
      is_mine: false,
    };
  });

  const enrichedAppointments = viewerCustomerId
    ? appointments
    : await attachAppointmentServices(appointments);

  return { spaces, appointments: enrichedAppointments, blocks };
}

export async function createSpaceBlock({ spaceId, startAt, endAt, reason }) {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO space_blocks (space_id, start_at, end_at, reason)
    VALUES (${spaceId}, ${startAt}, ${endAt}, ${reason || null})
    RETURNING *
  `;
  return rows[0];
}

export async function deleteSpaceBlock(blockId, businessId) {
  const sql = getSql();
  await sql`
    DELETE FROM space_blocks sb
    USING spaces sp
    WHERE sb.id = ${blockId} AND sb.space_id = sp.id AND sp.business_id = ${businessId}
  `;
}

export async function getAppointmentServices(appointmentId) {
  const sql = getSql();
  return sql`
    SELECT s.* FROM appointment_services aps
    JOIN services s ON s.id = aps.service_id
    WHERE aps.appointment_id = ${appointmentId}
  `;
}

export async function attachAppointmentServices(appointments) {
  if (!appointments.length) return appointments;
  const sql = getSql();
  const ids = appointments.map((apt) => apt.id);
  const rows = await sql`
    SELECT aps.appointment_id, s.*
    FROM appointment_services aps
    JOIN services s ON s.id = aps.service_id
    WHERE aps.appointment_id = ANY(${ids})
  `;
  const byAppointment = new Map();
  for (const row of rows) {
    const { appointment_id: appointmentId, ...service } = row;
    const list = byAppointment.get(appointmentId) || [];
    list.push(service);
    byAppointment.set(appointmentId, list);
  }
  return appointments.map((apt) => ({
    ...apt,
    services: byAppointment.get(apt.id) || [],
  }));
}

export async function createAppointment({
  businessId,
  customerId,
  spaceId,
  startAt,
  endAt,
  serviceIds = [],
  status = "active",
}) {
  const sql = getSql();
  let rows;
  try {
    rows = await sql`
      INSERT INTO appointments (business_id, customer_id, space_id, start_at, end_at, status)
      VALUES (${businessId}, ${customerId}, ${spaceId}, ${startAt}, ${endAt}, ${status})
      RETURNING *
    `;
  } catch (error) {
    if (isExclusionViolation(error)) return null;
    throw error;
  }
  const appointment = rows[0];

  for (const serviceId of serviceIds) {
    await sql`
      INSERT INTO appointment_services (appointment_id, service_id)
      VALUES (${appointment.id}, ${serviceId})
    `;
  }
  return appointment;
}

export async function customerHasOverlappingRequest({
  customerId,
  spaceId,
  startAt,
  endAt,
  excludeId = null,
}) {
  const sql = getSql();
  const rows = excludeId
    ? await sql`
        SELECT id FROM appointments
        WHERE customer_id = ${customerId}
          AND space_id = ${spaceId}
          AND status IN ('pending', 'active')
          AND start_at < ${endAt}
          AND end_at > ${startAt}
          AND id <> ${excludeId}
        LIMIT 1
      `
    : await sql`
        SELECT id FROM appointments
        WHERE customer_id = ${customerId}
          AND space_id = ${spaceId}
          AND status IN ('pending', 'active')
          AND start_at < ${endAt}
          AND end_at > ${startAt}
        LIMIT 1
      `;
  return rows.length > 0;
}

export async function rejectOverlappingPending({
  businessId,
  spaceId,
  startAt,
  endAt,
  excludeId,
}) {
  const sql = getSql();
  return sql`
    UPDATE appointments
    SET status = 'cancelled', cancelled_by = 'rejected', updated_at = NOW()
    WHERE business_id = ${businessId}
      AND space_id = ${spaceId}
      AND status = 'pending'
      AND id <> ${excludeId}
      AND start_at < ${endAt}
      AND end_at > ${startAt}
    RETURNING *
  `;
}

export async function listPendingAppointments(businessId) {
  await reconcileAppointmentStatuses(businessId);
  const sql = getSql();
  const rows = await sql`
    SELECT a.*, c.name AS customer_name, c.phone AS customer_phone, sp.name AS space_name
    FROM appointments a
    JOIN customers c ON c.id = a.customer_id
    JOIN spaces sp ON sp.id = a.space_id
    WHERE a.business_id = ${businessId}
      AND a.status = 'pending'
      AND a.start_at > NOW()
    ORDER BY a.start_at, sp.sort_order, a.created_at
  `;
  return attachAppointmentServices(rows);
}

export async function approveAppointment(appointmentId, businessId) {
  const sql = getSql();
  const rows = await sql`
    WITH target AS (
      SELECT id, business_id, customer_id, space_id, start_at, end_at
      FROM appointments
      WHERE id = ${appointmentId}
        AND business_id = ${businessId}
        AND status = 'pending'
        AND start_at > NOW()
    ),
    approved AS (
      UPDATE appointments apt
      SET status = 'active', updated_at = NOW()
      FROM target t
      WHERE apt.id = t.id
        AND NOT EXISTS (
          SELECT 1 FROM appointments a
          WHERE a.business_id = t.business_id
            AND a.space_id = t.space_id
            AND a.status = 'active'
            AND a.start_at < t.end_at
            AND a.end_at > t.start_at
        )
      RETURNING apt.*
    ),
    rejected AS (
      UPDATE appointments o
      SET status = 'cancelled', cancelled_by = 'rejected', updated_at = NOW()
      FROM approved a
      WHERE o.business_id = a.business_id
        AND o.space_id = a.space_id
        AND o.status = 'pending'
        AND o.id <> a.id
        AND o.start_at < a.end_at
        AND o.end_at > a.start_at
      RETURNING o.*
    )
    SELECT
      (SELECT row_to_json(t) FROM target t) AS target,
      (SELECT row_to_json(a) FROM approved a) AS approved,
      COALESCE((SELECT json_agg(row_to_json(r)) FROM rejected r), '[]'::json) AS rejected
  `;

  const row = rows[0];
  const target = row?.target && typeof row.target === "string" ? JSON.parse(row.target) : row?.target;
  const approved =
    row?.approved && typeof row.approved === "string" ? JSON.parse(row.approved) : row?.approved;
  const rejectedRaw =
    row?.rejected && typeof row.rejected === "string" ? JSON.parse(row.rejected) : row?.rejected;
  const rejected = Array.isArray(rejectedRaw) ? rejectedRaw : [];

  if (!target) {
    return { error: "La solicitud ya no está pendiente o el horario ya pasó." };
  }
  if (!approved) {
    return { error: "Ese espacio ya fue asignado a otra reserva." };
  }

  return { appointment: approved, rejected };
}

export async function rejectAppointment(appointmentId, businessId, cancelledBy = "declined") {
  const sql = getSql();
  const rows = await sql`
    UPDATE appointments
    SET status = 'cancelled', cancelled_by = ${cancelledBy}, updated_at = NOW()
    WHERE id = ${appointmentId} AND business_id = ${businessId} AND status = 'pending'
    RETURNING *
  `;
  return rows[0] || null;
}

export async function cancelAppointment(appointmentId, businessId, cancelledBy) {
  const sql = getSql();
  const rows = await sql`
    UPDATE appointments
    SET status = 'cancelled', cancelled_by = ${cancelledBy}, updated_at = NOW()
    WHERE id = ${appointmentId}
      AND business_id = ${businessId}
      AND status IN ('active', 'pending')
    RETURNING *
  `;
  return rows[0] || null;
}

export async function getAppointmentById(appointmentId, businessId) {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM appointments
    WHERE id = ${appointmentId} AND business_id = ${businessId}
    LIMIT 1
  `;
  return rows[0] || null;
}

export async function rescheduleAppointment(appointmentId, businessId, { spaceId, startAt, endAt }) {
  const sql = getSql();

  const blocked = await sql`
    SELECT 1 FROM space_blocks
    WHERE space_id = ${spaceId}
      AND start_at < ${endAt}
      AND end_at > ${startAt}
    LIMIT 1
  `;
  if (blocked.length > 0) return { error: "blocked" };

  let rows;
  try {
    rows = await sql`
      UPDATE appointments
      SET space_id = ${spaceId}, start_at = ${startAt}, end_at = ${endAt}, updated_at = NOW()
      WHERE id = ${appointmentId} AND business_id = ${businessId} AND status = 'active'
      RETURNING *
    `;
  } catch (error) {
    if (isExclusionViolation(error)) return { error: "conflict" };
    throw error;
  }
  if (!rows[0]) return { error: "not_found" };
  return { appointment: rows[0] };
}

export async function updateAppointment(appointmentId, businessId, { startAt, endAt, serviceIds }) {
  const sql = getSql();
  let rows;
  try {
    rows = await sql`
      UPDATE appointments SET start_at = ${startAt}, end_at = ${endAt}, updated_at = NOW()
      WHERE id = ${appointmentId} AND business_id = ${businessId} AND status IN ('active', 'pending')
      RETURNING *
    `;
  } catch (error) {
    if (isExclusionViolation(error)) return null;
    throw error;
  }
  if (!rows[0]) return null;

  if (serviceIds) {
    await sql`DELETE FROM appointment_services WHERE appointment_id = ${appointmentId}`;
    for (const serviceId of serviceIds) {
      await sql`
        INSERT INTO appointment_services (appointment_id, service_id) VALUES (${appointmentId}, ${serviceId})
      `;
    }
  }
  return rows[0];
}

export async function listCustomerAppointments(customerId, businessId) {
  await reconcileAppointmentStatuses(businessId);
  const sql = getSql();
  const appointments = await sql`
    SELECT a.*, sp.name AS space_name
    FROM appointments a
    JOIN spaces sp ON sp.id = a.space_id
    WHERE a.customer_id = ${customerId} AND a.business_id = ${businessId}
      AND (
        (a.status IN ('pending', 'active') AND a.start_at >= NOW())
        OR a.id IN (
          SELECT id FROM appointments
          WHERE customer_id = ${customerId} AND business_id = ${businessId}
            AND NOT (status IN ('pending', 'active') AND start_at >= NOW())
          ORDER BY start_at DESC
          LIMIT ${CLIENT_HISTORY_LIMIT}
        )
      )
    ORDER BY
      CASE
        WHEN a.status = 'pending' AND a.start_at >= NOW() THEN 0
        WHEN a.status = 'active' AND a.start_at >= NOW() THEN 1
        ELSE 2
      END,
      a.start_at DESC
  `;

  return attachAppointmentServices(appointments);
}

export async function getTodayAppointments(businessId) {
  await reconcileAppointmentStatuses(businessId);
  const sql = getSql();
  const rows = await sql`
    SELECT a.*, c.name AS customer_name, c.phone AS customer_phone, sp.name AS space_name
    FROM appointments a
    JOIN customers c ON c.id = a.customer_id
    JOIN spaces sp ON sp.id = a.space_id
    WHERE a.business_id = ${businessId}
      AND a.status = 'active'
      AND (a.start_at AT TIME ZONE 'America/Costa_Rica')::date =
          (NOW() AT TIME ZONE 'America/Costa_Rica')::date
    ORDER BY a.start_at
  `;
  return attachAppointmentServices(rows);
}

export async function listNotifications(recipientRole, recipientId, businessId) {
  const sql = getSql();
  return sql`
    SELECT * FROM notifications
    WHERE recipient_role = ${recipientRole}
      AND recipient_id = ${recipientId}
      AND business_id = ${businessId}
    ORDER BY created_at DESC
    LIMIT 50
  `;
}

export async function createNotification({ businessId, recipientRole, recipientId, type, title, body }) {
  const sql = getSql();
  await sql`
    INSERT INTO notifications (business_id, recipient_role, recipient_id, type, title, body)
    VALUES (${businessId}, ${recipientRole}, ${recipientId}, ${type}, ${title}, ${body})
  `;
}

export async function notifyCustomersRejected(_businessId, _appointments) {
  return;
}

export async function markNotificationRead(id, recipientRole, recipientId) {
  const sql = getSql();
  await sql`
    UPDATE notifications SET read_at = NOW()
    WHERE id = ${id} AND recipient_role = ${recipientRole} AND recipient_id = ${recipientId}
  `;
}

export async function updateBusinessSettings(businessId, settings) {
  const sql = getSql();
  await sql`
    UPDATE business_settings SET
      min_modify_hours = ${settings.min_modify_hours},
      min_appointment_minutes = ${settings.min_appointment_minutes},
      show_services_list = ${settings.show_services_list},
      reminders_enabled = ${settings.reminders_enabled},
      notify_inactive_enabled = ${settings.notify_inactive_enabled},
      notify_inactive_days = ${settings.notify_inactive_days},
      notify_new_booking = ${settings.notify_new_booking},
      notify_cancel_booking = ${settings.notify_cancel_booking},
      require_booking_approval = ${settings.require_booking_approval},
      use_custom_weekly_hours = ${settings.use_custom_weekly_hours},
      updated_at = NOW()
    WHERE business_id = ${businessId}
  `;
}

export async function updateBusinessSchedule(businessId, { openHour, closeHour, slotMinutes }) {
  const sql = getSql();
  await sql`
    UPDATE businesses SET
      open_hour = ${openHour},
      close_hour = ${closeHour},
      slot_minutes = ${slotMinutes}
    WHERE id = ${businessId}
  `;
}

export async function replaceWeeklyHours(businessId, days) {
  const sql = getSql();
  await sql`DELETE FROM business_weekly_hours WHERE business_id = ${businessId}`;
  for (const day of days) {
    await sql`
      INSERT INTO business_weekly_hours (business_id, weekday, is_open, open_hour, close_hour)
      VALUES (
        ${businessId},
        ${day.weekday},
        ${day.isOpen},
        ${day.openHour},
        ${day.closeHour}
      )
    `;
  }
}

export async function listAdmins(businessId) {
  const sql = getSql();
  return sql`SELECT id FROM admins WHERE business_id = ${businessId}`;
}

function unionOccupiedMinutes(intervals) {
  if (!intervals.length) return 0;
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  let total = 0;
  let curStart = sorted[0].start;
  let curEnd = sorted[0].end;
  for (let i = 1; i < sorted.length; i += 1) {
    const next = sorted[i];
    if (next.start < curEnd) {
      curEnd = Math.max(curEnd, next.end);
    } else {
      total += (curEnd - curStart) / 60_000;
      curStart = next.start;
      curEnd = next.end;
    }
  }
  return total + (curEnd - curStart) / 60_000;
}

export async function getWeeklyReport(businessId, referenceDate = new Date()) {
  await reconcileAppointmentStatuses(businessId);
  const business = await getBusinessById(businessId);
  if (!business) return null;

  const weekDates = getWeekDates(referenceDate);
  const weekStartKey = toDateInputStr(weekDates[0]);
  const weekEndKey = toDateInputStr(weekDates[6]);
  const weekStart = getCalendarDayBounds(weekStartKey).start;
  const weekEnd = getCalendarDayBounds(weekEndKey).end;

  const spaces = await listSpaces(businessId);
  const spaceCount = spaces.length;

  const sql = getSql();
  const appointments = await sql`
    SELECT space_id, start_at, end_at, status
    FROM appointments
    WHERE business_id = ${businessId}
      AND start_at >= ${weekStart.toISOString()}
      AND start_at <= ${weekEnd.toISOString()}
  `;

  const days = weekDates.map((date, index) => {
    const dateKey = toDateInputStr(date);
    const hours = resolveHours(business, dateKey);
    const openMinutes = hours.isClosed ? 0 : parseBusinessMinutes(hours.openHour);
    const closeMinutes = hours.isClosed ? 0 : parseBusinessMinutes(hours.closeHour);
    const dailyCapacityMinutes = Math.max(0, spaceCount * (closeMinutes - openMinutes));
    const { start: dayStart, end: dayEnd } = getCalendarDayBounds(dateKey);

    const dayAppointments = appointments.filter((apt) => {
      if (!["active", "completed"].includes(apt.status)) return false;
      const start = new Date(apt.start_at);
      return start >= dayStart && start <= dayEnd;
    });

    const bySpace = new Map();
    for (const apt of dayAppointments) {
      const list = bySpace.get(apt.space_id) || [];
      list.push({ start: new Date(apt.start_at).getTime(), end: new Date(apt.end_at).getTime() });
      bySpace.set(apt.space_id, list);
    }

    let bookedMinutes = 0;
    for (const intervals of bySpace.values()) {
      bookedMinutes += unionOccupiedMinutes(intervals);
    }

    const value =
      dailyCapacityMinutes > 0
        ? Math.min(100, Math.round((bookedMinutes / dailyCapacityMinutes) * 100))
        : 0;

    return {
      label: WEEKDAY_LABELS[index],
      value,
      date: dateKey,
      appointmentCount: dayAppointments.length,
      bookedMinutes: Math.round(bookedMinutes),
    };
  });

  const peak = days.reduce((best, day) => (day.value > best.value ? day : best), days[0]);
  const avgOccupancy =
    days.length > 0 ? Math.round(days.reduce((sum, d) => sum + d.value, 0) / days.length) : 0;
  const totalAppointments = days.reduce((sum, d) => sum + d.appointmentCount, 0);
  const cancelledCount = appointments.filter((a) => a.status === "cancelled").length;

  return {
    weekLabel: formatWeekRange(weekDates),
    weekStart: weekStartKey,
    weekEnd: weekEndKey,
    spaceCount,
    days,
    peak,
    avgOccupancy,
    totalAppointments,
    cancelledCount,
  };
}
