-- Add DELETE policy for customers
create policy "Allow public delete access" on customers for delete using (true);

-- Add DELETE policy for laundry_orders
create policy "Allow public delete access" on laundry_orders for delete using (true);
