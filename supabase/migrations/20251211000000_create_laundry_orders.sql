create table laundry_orders (
  id uuid default gen_random_uuid() primary key,
  invoice_number text unique not null,
  customer_name text not null,
  customer_phone text not null,
  service_type text not null,
  status text default 'processing' check (status in ('processing', 'ready', 'completed')),
  created_at timestamptz default now(),
  target_completion_time timestamptz not null,
  completed_at timestamptz
);

-- Enable Row Level Security
alter table laundry_orders enable row level security;

-- Create policies (for demonstration, allow public access, but in prod should be restricted)
create policy "Allow public read access" on laundry_orders for select using (true);
create policy "Allow public insert access" on laundry_orders for insert with check (true);
create policy "Allow public update access" on laundry_orders for update using (true);
