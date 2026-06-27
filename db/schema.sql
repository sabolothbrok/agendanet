-- ============================================================
-- AgendaNet — Plataforma multi-negocio (Neon Postgres)
-- Roles: admin general (plataforma), admin de negocio y cliente
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS platform_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_admin_id UUID NOT NULL REFERENCES platform_admins(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  business_type TEXT NOT NULL DEFAULT 'general',
  open_hour TIME NOT NULL DEFAULT '09:00',
  close_hour TIME NOT NULL DEFAULT '18:00',
  slot_minutes INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_businesses_platform_admin ON businesses (platform_admin_id);

CREATE TABLE IF NOT EXISTS business_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS business_settings (
  business_id UUID PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,
  min_modify_hours INTEGER NOT NULL DEFAULT 24,
  min_appointment_minutes INTEGER NOT NULL DEFAULT 30,
  show_services_list BOOLEAN NOT NULL DEFAULT TRUE,
  reminders_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  notify_inactive_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  notify_inactive_days INTEGER NOT NULL DEFAULT 30,
  notify_new_booking BOOLEAN NOT NULL DEFAULT TRUE,
  notify_cancel_booking BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Un administrador por negocio
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, phone)
);

CREATE TABLE IF NOT EXISTS invite_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes')
);

CREATE INDEX IF NOT EXISTS idx_invite_links_expires ON invite_links (expires_at);

CREATE TABLE IF NOT EXISTS spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS space_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_at > start_at)
);

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
  cancelled_by TEXT CHECK (cancelled_by IS NULL OR cancelled_by IN ('customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_at > start_at)
);

CREATE TABLE IF NOT EXISTS appointment_services (
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (appointment_id, service_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  recipient_role TEXT NOT NULL CHECK (recipient_role IN ('admin', 'customer')),
  recipient_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_business_start ON appointments (business_id, start_at);
CREATE INDEX IF NOT EXISTS idx_appointments_customer ON appointments (customer_id, start_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications (recipient_role, recipient_id, read_at);
CREATE INDEX IF NOT EXISTS idx_space_blocks_space ON space_blocks (space_id, start_at);
CREATE INDEX IF NOT EXISTS idx_customers_business ON customers (business_id) WHERE deleted_at IS NULL;

INSERT INTO platform_admins (phone, name)
SELECT '77770000', 'Admin General'
WHERE NOT EXISTS (SELECT 1 FROM platform_admins WHERE phone = '77770000');

INSERT INTO business_types (slug, label, sort_order)
SELECT v.slug, v.label, v.sort_order
FROM (VALUES
  ('general', 'General', 1),
  ('nails', 'Uñas', 2),
  ('barber', 'Barbería', 3),
  ('car_wash', 'Lavacar', 4)
) AS v(slug, label, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM business_types LIMIT 1);

INSERT INTO businesses (platform_admin_id, slug, name, business_type, open_hour, close_hour, slot_minutes)
SELECT pa.id, 'demo-unas', 'Demo Uñas', 'nails', '09:00', '18:00', 30
FROM platform_admins pa
WHERE pa.phone = '77770000'
  AND NOT EXISTS (SELECT 1 FROM businesses WHERE slug = 'demo-unas');

INSERT INTO business_settings (business_id)
SELECT id FROM businesses WHERE slug = 'demo-unas'
ON CONFLICT (business_id) DO NOTHING;

INSERT INTO admins (business_id, phone, name)
SELECT b.id, '88880000', 'Admin Demo'
FROM businesses b WHERE b.slug = 'demo-unas'
ON CONFLICT (business_id) DO NOTHING;

INSERT INTO spaces (business_id, name, sort_order)
SELECT b.id, v.name, v.sort_order
FROM businesses b
CROSS JOIN (VALUES ('Estación 1', 1), ('Estación 2', 2), ('Estación 3', 3)) AS v(name, sort_order)
WHERE b.slug = 'demo-unas'
  AND NOT EXISTS (SELECT 1 FROM spaces s WHERE s.business_id = b.id);

INSERT INTO services (business_id, name, duration_minutes, price, is_premium)
SELECT b.id, v.name, v.duration, v.price, v.premium
FROM businesses b
CROSS JOIN (VALUES
  ('Manicure básica', 45, 18000, FALSE),
  ('Manicure gel', 60, 28000, FALSE),
  ('Pedicure', 60, 22000, FALSE),
  ('Nail art premium', 30, 15000, TRUE)
) AS v(name, duration, price, premium)
WHERE b.slug = 'demo-unas'
  AND NOT EXISTS (SELECT 1 FROM services s WHERE s.business_id = b.id);

INSERT INTO customers (business_id, phone, name)
SELECT b.id, '66660000', 'Cliente Demo'
FROM businesses b
WHERE b.slug = 'demo-unas'
  AND NOT EXISTS (
    SELECT 1 FROM customers c WHERE c.business_id = b.id AND c.phone = '66660000'
  );
