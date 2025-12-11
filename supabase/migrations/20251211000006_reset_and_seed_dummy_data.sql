-- Reset and Reseed Dummy Data

-- 1. Clear existing data
TRUNCATE TABLE laundry_orders RESTART IDENTITY;

-- 2. Insert new dummy data with varied progress
-- Progress = (now - created_at) / (target - created_at)

INSERT INTO laundry_orders (invoice_number, customer_name, customer_phone, service_type, status, created_at, target_completion_time, completed_at, price, weight, unit_type) VALUES

-- STATUS: COMPLETED (100%)
('INV-2024001', 'Budi Santoso', '081234567890', 'Cuci Komplit Regular', 'completed', 
 now() - interval '5 days', 
 now() - interval '3 days', 
 now() - interval '3 days', 
 30000, 5.0, 'kg'),

('INV-2024002', 'Siti Aminah', '081234567891', 'Cuci Komplit Express', 'completed', 
 now() - interval '4 days', 
 now() - interval '3 days', 
 now() - interval '3 days', 
 50000, 5.0, 'kg'),

-- STATUS: READY (100% - Waiting for pickup)
('INV-2024003', 'Rudi Hartono', '081234567892', 'Setrika Saja', 'ready', 
 now() - interval '2 days', 
 now() - interval '2 hours', 
 NULL, 
 20000, 5.0, 'kg'),

-- STATUS: PROCESSING - STAGE: FINISHING / WAITING FINALIZATION (Capped at 87%)
-- Progress > 87% but not ready yet.
-- Created 46 hours ago, Target in 2 hours. Total 48h. Elapsed 46h. 46/48 = 95%. Should show 87%.
('INV-2024004', 'Dewi Sartika', '081234567893', 'Cuci Komplit Regular', 'processing', 
 now() - interval '46 hours', 
 now() + interval '2 hours', 
 NULL, 
 24000, 4.0, 'kg'),

-- STATUS: PROCESSING - STAGE: SETRIKA & PACKING (75% - 87%)
-- Target 80%.
-- Total 48h. 80% of 48h = 38.4h elapsed.
('INV-2024005', 'Andi Wijaya', '081234567894', 'Cuci Komplit Kilat', 'processing', 
 now() - interval '39 hours', 
 now() + interval '9 hours', 
 NULL, 
 45000, 3.0, 'kg'),

-- STATUS: PROCESSING - STAGE: PROSES PENGERINGAN (50% - 75%)
-- Target 60%.
-- Total 48h. 60% of 48h = 28.8h elapsed.
('INV-2024006', 'Maya Putri', '081234567895', 'Cuci Komplit Regular', 'processing', 
 now() - interval '29 hours', 
 now() + interval '19 hours', 
 NULL, 
 18000, 3.0, 'kg'),

-- STATUS: PROCESSING - STAGE: PROSES PENCUCIAN (25% - 50%)
-- Target 40%.
-- Total 48h. 40% of 48h = 19.2h elapsed.
('INV-2024007', 'Eko Prasetyo', '081234567896', 'Cuci Komplit Regular', 'processing', 
 now() - interval '20 hours', 
 now() + interval '28 hours', 
 NULL, 
 24000, 4.0, 'kg'),

-- STATUS: PROCESSING - STAGE: PEMILAHAN (10% - 25%)
-- Target 15%.
-- Total 48h. 15% of 48h = 7.2h elapsed.
('INV-2024008', 'Rina Wati', '081234567897', 'Setrika Saja', 'processing', 
 now() - interval '8 hours', 
 now() + interval '40 hours', 
 NULL, 
 12000, 3.0, 'kg'),

-- STATUS: PROCESSING - JUST STARTED (10%)
-- Target 2%.
-- Total 48h. 1h elapsed.
('INV-2024009', 'Joko Susilo', '081234567898', 'Cuci Komplit Express', 'processing', 
 now() - interval '1 hours', 
 now() + interval '47 hours', 
 NULL, 
 30000, 3.0, 'kg'),

-- MORE RANDOM DATA
('INV-2024010', 'Tini Suhartini', '081234567899', 'Bed Cover Kecil', 'processing', now() - interval '10 hours', now() + interval '38 hours', null, 15000, 1.0, 'pcs'),
('INV-2024011', 'Agus Salim', '081234567800', 'Cuci Komplit Regular', 'processing', now() - interval '30 hours', now() + interval '18 hours', null, 42000, 7.0, 'kg'),
('INV-2024012', 'Ratna Sari', '081234567801', 'Cuci Komplit Regular', 'processing', now() - interval '40 hours', now() + interval '8 hours', null, 12000, 2.0, 'kg');
