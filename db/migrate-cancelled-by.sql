-- Añade quién canceló la cita (ejecutar en DB existente sin reset)
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS cancelled_by TEXT
  CHECK (cancelled_by IS NULL OR cancelled_by IN ('customer', 'admin'));
