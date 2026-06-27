INSERT INTO customers (business_id, phone, name)
SELECT b.id, '66660000', 'Cliente Demo'
FROM businesses b
WHERE b.slug = 'demo-unas'
  AND NOT EXISTS (
    SELECT 1 FROM customers c WHERE c.business_id = b.id AND c.phone = '66660000'
  );
