create table customers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  phone text not null unique,
  created_at timestamptz default now()
);

-- Enable RLS
alter table customers enable row level security;

-- Policies
create policy "Allow public read access" on customers for select using (true);
create policy "Allow public insert access" on customers for insert with check (true);
create policy "Allow public update access" on customers for update using (true);
