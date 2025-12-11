-- Fix dummy data timestamps to simulate realistic progress

-- INV-1012006: 20% Progress (Pemilahan)
-- Total duration 2 days. Elapsed needs to be ~10 hours.
UPDATE laundry_orders
SET 
    created_at = now() - interval '10 hours',
    target_completion_time = now() + interval '38 hours'
WHERE invoice_number = 'INV-1012006';

-- INV-1012007: 40% Progress (Proses Pencucian)
-- Total duration 2 days. Elapsed needs to be ~20 hours.
UPDATE laundry_orders
SET 
    created_at = now() - interval '20 hours',
    target_completion_time = now() + interval '28 hours'
WHERE invoice_number = 'INV-1012007';

-- INV-1012008: 60% Progress (Proses Pengeringan)
-- Total duration 2 days. Elapsed needs to be ~29 hours.
UPDATE laundry_orders
SET 
    created_at = now() - interval '29 hours',
    target_completion_time = now() + interval '19 hours'
WHERE invoice_number = 'INV-1012008';

-- INV-1012009: 80% Progress (Setrika & Packing)
-- Total duration 2 days. Elapsed needs to be ~38 hours.
UPDATE laundry_orders
SET 
    created_at = now() - interval '38 hours',
    target_completion_time = now() + interval '10 hours'
WHERE invoice_number = 'INV-1012009';

-- INV-1012021: 95% Progress (Should be capped at 87% - Finishing)
-- Total duration 2 days. Elapsed needs to be ~46 hours.
UPDATE laundry_orders
SET 
    created_at = now() - interval '46 hours',
    target_completion_time = now() + interval '2 hours'
WHERE invoice_number = 'INV-1012021';

-- INV-1012022: 10% Progress (Just Started)
UPDATE laundry_orders
SET 
    created_at = now() - interval '1 hours',
    target_completion_time = now() + interval '47 hours'
WHERE invoice_number = 'INV-1012022';
