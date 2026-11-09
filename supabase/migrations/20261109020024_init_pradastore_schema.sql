-- Schema and RLS policies for pradastore (project: brdheaocgioblejfukak)

CREATE TABLE IF NOT EXISTS public.phones (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  data jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customers (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  data jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  data jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.phones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_phones_user ON public.phones (user_id);
CREATE INDEX IF NOT EXISTS idx_customers_user ON public.customers (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders (user_id);

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.phones;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.customers;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.profiles;

DROP POLICY IF EXISTS "Users manage own phones" ON public.phones;
CREATE POLICY "Users manage own phones" ON public.phones
  FOR ALL TO authenticated
  USING ( (SELECT auth.uid())::text = user_id )
  WITH CHECK ( (SELECT auth.uid())::text = user_id );

DROP POLICY IF EXISTS "Users manage own customers" ON public.customers;
CREATE POLICY "Users manage own customers" ON public.customers
  FOR ALL TO authenticated
  USING ( (SELECT auth.uid())::text = user_id )
  WITH CHECK ( (SELECT auth.uid())::text = user_id );

DROP POLICY IF EXISTS "Users manage own orders" ON public.orders;
CREATE POLICY "Users manage own orders" ON public.orders
  FOR ALL TO authenticated
  USING ( (SELECT auth.uid())::text = user_id )
  WITH CHECK ( (SELECT auth.uid())::text = user_id );

DROP POLICY IF EXISTS "Users manage own profile" ON public.profiles;
CREATE POLICY "Users manage own profile" ON public.profiles
  FOR ALL TO authenticated
  USING ( (SELECT auth.uid())::text = id )
  WITH CHECK ( (SELECT auth.uid())::text = id );

