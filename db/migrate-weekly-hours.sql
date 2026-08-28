-- Additive: per-weekday schedule without dropping data.

ALTER TABLE business_settings
  ADD COLUMN IF NOT EXISTS use_custom_weekly_hours BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS business_weekly_hours (
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  is_open BOOLEAN NOT NULL DEFAULT TRUE,
  open_hour TIME NOT NULL DEFAULT '09:00',
  close_hour TIME NOT NULL DEFAULT '18:00',
  PRIMARY KEY (business_id, weekday),
  CHECK (close_hour > open_hour)
);
