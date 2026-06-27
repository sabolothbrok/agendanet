-- Elimina servicios duplicados, conservando el más antiguo de cada nombre
DELETE FROM services
WHERE id NOT IN (
  SELECT DISTINCT ON (name) id
  FROM services
  ORDER BY name, created_at ASC
);
