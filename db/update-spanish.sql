-- Actualiza servicios existentes (inglés) a español con precios en colones
-- Ejecutar si ya tenías la base de datos con los servicios en inglés

UPDATE services SET
  name = 'Manicure clásica',
  description = 'Limado, cuidado de cutículas y esmaltado tradicional con acabado impecable.',
  price = 18000.00
WHERE name = 'Classic Manicure';

UPDATE services SET
  name = 'Manicure en gel',
  description = 'Esmaltado en gel de larga duración con brillo intenso y secado al instante.',
  price = 28000.00
WHERE name = 'Gel Manicure';

UPDATE services SET
  name = 'Pedicure clásica',
  description = 'Remojo relajante, exfoliación suave y esmaltado con cuidado completo de pies.',
  price = 22000.00
WHERE name = 'Classic Pedicure';

UPDATE services SET
  name = 'Pedicure en gel',
  description = 'Pedicure completa con esmaltado en gel resistente por semanas.',
  price = 35000.00
WHERE name = 'Gel Pedicure';

UPDATE services SET
  name = 'Set acrílico completo',
  description = 'Extensiones acrílicas con forma personalizada y acabado profesional.',
  price = 45000.00
WHERE name = 'Acrylic Full Set';

UPDATE services SET
  name = 'Diseño / nail art',
  description = 'Diseños personalizados, pedrería y arte decorativo sobre cualquier servicio.',
  price = 12000.00
WHERE name = 'Nail Art Add-on';
