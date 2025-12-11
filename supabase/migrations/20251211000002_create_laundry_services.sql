create table laundry_services (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  price_per_unit decimal(12,2) not null,
  unit_type text not null check (unit_type in ('kg', 'pcs')),
  duration_hours integer not null,
  description text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table laundry_services enable row level security;

-- Policies
create policy "Allow public read access" on laundry_services for select using (true);
create policy "Allow public insert access" on laundry_services for insert with check (true);
create policy "Allow public update access" on laundry_services for update using (true);
create policy "Allow public delete access" on laundry_services for delete using (true);

-- Insert default services
insert into laundry_services (name, price_per_unit, unit_type, duration_hours, description) values
('Cuci Komplit Regular', 6000, 'kg', 48, 'Cuci + Setrika + Parfum (2 Hari)'),
('Cuci Komplit Express', 10000, 'kg', 24, 'Cuci + Setrika + Parfum (1 Hari)'),
('Cuci Komplit Kilat', 15000, 'kg', 6, 'Cuci + Setrika + Parfum (6 Jam)'),
('Setrika Saja', 4000, 'kg', 24, 'Hanya Setrika + Parfum'),
('Bed Cover Kecil', 15000, 'pcs', 48, 'Cuci Bed Cover Ukuran Single'),
('Bed Cover Besar', 25000, 'pcs', 48, 'Cuci Bed Cover Ukuran Double');
