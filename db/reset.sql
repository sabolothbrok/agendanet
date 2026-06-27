-- Elimina tablas viejas (salón) y nuevas (AgendaNet) para aplicar esquema limpio.
-- ⚠️ Borra todos los datos. Solo usar en desarrollo o si aceptas perder datos.

DROP TABLE IF EXISTS appointment_services CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS space_blocks CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS spaces CASCADE;
DROP TABLE IF EXISTS invite_links CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS business_settings CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;
DROP TABLE IF EXISTS business_types CASCADE;
DROP TABLE IF EXISTS platform_admins CASCADE;
