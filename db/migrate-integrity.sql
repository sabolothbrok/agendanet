-- Integrity: overlap exclusion, extra indexes, auth rate-limit log, cancelled_by values.

CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'appointments'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%cancelled_by%'
  LOOP
    EXECUTE format('ALTER TABLE appointments DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE appointments
  ADD CONSTRAINT appointments_cancelled_by_check
  CHECK (cancelled_by IS NULL OR cancelled_by IN ('customer', 'admin', 'rejected', 'expired', 'declined'));

UPDATE appointments
SET status = 'completed', updated_at = NOW()
WHERE status = 'active' AND end_at <= NOW();

UPDATE appointments
SET status = 'cancelled', cancelled_by = 'expired', updated_at = NOW()
WHERE status = 'pending' AND start_at <= NOW();

UPDATE appointments a
SET status = 'cancelled', cancelled_by = 'rejected', updated_at = NOW()
WHERE a.status = 'active'
  AND EXISTS (
    SELECT 1 FROM appointments b
    WHERE b.status = 'active'
      AND b.space_id = a.space_id
      AND b.id <> a.id
      AND b.start_at < a.end_at
      AND b.end_at > a.start_at
      AND (b.created_at < a.created_at OR (b.created_at = a.created_at AND b.id < a.id))
  );

ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_no_overlap_active;
ALTER TABLE appointments
  ADD CONSTRAINT appointments_no_overlap_active
  EXCLUDE USING gist (
    space_id WITH =,
    tstzrange(start_at, end_at, '[)') WITH &&
  )
  WHERE (status = 'active');

CREATE INDEX IF NOT EXISTS idx_appointments_space_start ON appointments (space_id, start_at);
CREATE INDEX IF NOT EXISTS idx_services_business ON services (business_id);
CREATE INDEX IF NOT EXISTS idx_notifications_business ON notifications (business_id);

CREATE TABLE IF NOT EXISTS auth_attempts (
  key TEXT NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_attempts_key_time ON auth_attempts (key, attempted_at);
