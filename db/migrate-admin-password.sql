-- Adds password auth for admin/platform_admin roles: phone alone let anyone
-- who knew the number log in. Nullable so existing accounts fall into the
-- "create your password on next login" flow instead of breaking.
ALTER TABLE admins ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE platform_admins ADD COLUMN IF NOT EXISTS password_hash TEXT;
