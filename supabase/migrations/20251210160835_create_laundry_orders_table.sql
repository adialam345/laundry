/*
  # Create Laundry Orders Table

  1. New Tables
    - `orders`
      - `id` (uuid, primary key) - Unique order identifier
      - `customer_name` (text) - Customer name
      - `phone_number` (text) - Customer WhatsApp number (format: 628xxx)
      - `package_type` (text) - Package type: 'kilat', 'express', or 'reguler'
      - `start_time` (timestamptz) - When the order started
      - `duration_minutes` (integer) - Total duration in minutes (180/1440/4320)
      - `status` (text) - Order status: 'IN_PROGRESS' or 'COMPLETED'
      - `created_at` (timestamptz) - Record creation timestamp
  
  2. Security
    - Enable RLS on `orders` table
    - Add policy for public access (since this is a simple laundry management system)
*/

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  phone_number text NOT NULL,
  package_type text NOT NULL CHECK (package_type IN ('kilat', 'express', 'reguler')),
  start_time timestamptz NOT NULL DEFAULT now(),
  duration_minutes integer NOT NULL,
  status text NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to orders"
  ON orders FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert access to orders"
  ON orders FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update access to orders"
  ON orders FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to orders"
  ON orders FOR DELETE
  TO anon
  USING (true);