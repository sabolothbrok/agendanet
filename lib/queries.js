import { getSql } from "./db";
import { INVITE_TTL_MINUTES } from "./constants";

export async function getBusinessBySlug(slug) {
  const sql = getSql();
  const rows = await sql`
    SELECT b.*, s.min_modify_hours, s.min_appointment_minutes, s.show_services_list,
           s.reminders_enabled, s.notify_inactive_enabled, s.notify_inactive_days,
           s.notify_new_booking, s.notify_cancel_booking
    FROM businesses b
    JOIN business_settings s ON s.business_id = b.id
    WHERE b.slug = ${slug}
    LIMIT 1
  `;
  return rows[0] || null;
}

export async function getBusinessById(id) {
  const sql = getSql();
  const rows = await sql`
    SELECT b.*, s.min_modify_hours, s.min_appointment_minutes, s.show_services_list,
           s.reminders_enabled, s.notify_inactive_enabled, s.notify_inactive_days,
           s.notify_new_booking, s.notify_cancel_booking
    FROM businesses b
    JOIN business_settings s ON s.business_id = b.id
    WHERE b.id = ${id}
    LIMIT 1
  `;
  return rows[0] || null;
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
       WHERE a.customer_id = c.id AND a.status = 'active') AS last_appointment
    FROM customers c
    WHERE c.business_id = ${businessId} AND c.deleted_at IS NULL
    ORDER BY c.created_at DESC
  `;
}

export async function deleteCustomer(customerId, businessId) {
  const sql = getSql();
  await sql`
    UPDATE customers SET deleted_at = NOW()
    WHERE id = ${customerId} AND business_id = ${businessId}
  `;
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
    WHERE space_id = ${spaceId} AND status = 'active' AND start_at > NOW()
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

export async function getCalendarData(businessId, dateStr, { viewerCustomerId = null } = {}) {
  const sql = getSql();
  const dayStart = `${dateStr}T00:00:00`;
  const dayEnd = `${dateStr}T23:59:59`;

  const [spaces, rows, blocks] = await Promise.all([
    listSpaces(businessId),
    sql`
      SELECT a.*, c.name AS customer_name, c.phone AS customer_phone,
        s.name AS space_name
      FROM appointments a
      JOIN customers c ON c.id = a.customer_id
      JOIN spaces s ON s.id = a.space_id
      WHERE a.business_id = ${businessId}
        AND a.status = 'active'
        AND a.start_at >= ${dayStart}::timestamptz
        AND a.start_at <= ${dayEnd}::timestamptz
      ORDER BY a.start_at
    `,
    sql`
      SELECT sb.*, sp.name AS space_name
      FROM space_blocks sb
      JOIN spaces sp ON sp.id = sb.space_id
      WHERE sp.business_id = ${businessId}
        AND sb.start_at <= ${dayEnd}::timestamptz
        AND sb.end_at >= ${dayStart}::timestamptz
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

  return { spaces, appointments, blocks };
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

export async function createAppointment({
  businessId,
  customerId,
  spaceId,
  startAt,
  endAt,
  serviceIds = [],
}) {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO appointments (business_id, customer_id, space_id, start_at, end_at)
    VALUES (${businessId}, ${customerId}, ${spaceId}, ${startAt}, ${endAt})
    RETURNING *
  `;
  const appointment = rows[0];

  for (const serviceId of serviceIds) {
    await sql`
      INSERT INTO appointment_services (appointment_id, service_id)
      VALUES (${appointment.id}, ${serviceId})
    `;
  }
  return appointment;
}

export async function cancelAppointment(appointmentId, businessId, cancelledBy) {
  const sql = getSql();
  const rows = await sql`
    UPDATE appointments
    SET status = 'cancelled', cancelled_by = ${cancelledBy}, updated_at = NOW()
    WHERE id = ${appointmentId} AND business_id = ${businessId} AND status = 'active'
    RETURNING *
  `;
  return rows[0] || null;
}

export async function updateAppointment(appointmentId, businessId, { startAt, endAt, serviceIds }) {
  const sql = getSql();
  const rows = await sql`
    UPDATE appointments SET start_at = ${startAt}, end_at = ${endAt}, updated_at = NOW()
    WHERE id = ${appointmentId} AND business_id = ${businessId} AND status = 'active'
    RETURNING *
  `;
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
  const sql = getSql();
  const appointments = await sql`
    SELECT a.*, sp.name AS space_name
    FROM appointments a
    JOIN spaces sp ON sp.id = a.space_id
    WHERE a.customer_id = ${customerId} AND a.business_id = ${businessId}
    ORDER BY
      CASE WHEN a.status = 'active' AND a.start_at >= NOW() THEN 0 ELSE 1 END,
      a.start_at DESC
  `;

  const result = [];
  for (const apt of appointments) {
    const services = await getAppointmentServices(apt.id);
    result.push({ ...apt, services });
  }
  return result;
}

export async function getTodayAppointments(businessId) {
  const sql = getSql();
  return sql`
    SELECT a.*, c.name AS customer_name, c.phone AS customer_phone, sp.name AS space_name
    FROM appointments a
    JOIN customers c ON c.id = a.customer_id
    JOIN spaces sp ON sp.id = a.space_id
    WHERE a.business_id = ${businessId}
      AND a.status = 'active'
      AND a.start_at::date = CURRENT_DATE
    ORDER BY a.start_at
  `;
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
      updated_at = NOW()
    WHERE business_id = ${businessId}
  `;
}

export async function listAdmins(businessId) {
  const sql = getSql();
  return sql`SELECT id FROM admins WHERE business_id = ${businessId}`;
}
