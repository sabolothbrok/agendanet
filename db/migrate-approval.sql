-- Additive: approval toggle + pending/rejected appointment states.
-- Does not drop tables or data.

ALTER TABLE business_settings
  ADD COLUMN IF NOT EXISTS require_booking_approval BOOLEAN NOT NULL DEFAULT FALSE;

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
      AND pg_get_constraintdef(con.oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE appointments DROP CONSTRAINT %I', r.conname);
  END LOOP;

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
  ADD CONSTRAINT appointments_status_check
  CHECK (status IN ('pending', 'active', 'cancelled', 'completed'));

ALTER TABLE appointments
  ADD CONSTRAINT appointments_cancelled_by_check
  CHECK (cancelled_by IS NULL OR cancelled_by IN ('customer', 'admin', 'rejected'));
