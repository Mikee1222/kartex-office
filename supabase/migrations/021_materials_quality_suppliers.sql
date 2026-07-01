-- Materials, quality grades, suppliers lookups + product fields

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.materials enable row level security;
drop policy if exists "materials_all" on public.materials;
create policy "materials_all" on public.materials
  for all to authenticated using (true) with check (true);
grant select, insert, update, delete on public.materials to authenticated;

insert into public.materials (name)
values ('Βαμβάκι'), ('Πολυεστέρας'), ('Μικροΐνες'), ('Μεταξωτό'), ('Άλλο')
on conflict (name) do nothing;

create table if not exists public.quality_grades (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.quality_grades enable row level security;
drop policy if exists "quality_grades_all" on public.quality_grades;
create policy "quality_grades_all" on public.quality_grades
  for all to authenticated using (true) with check (true);
grant select, insert, update, delete on public.quality_grades to authenticated;

insert into public.quality_grades (name)
values ('Standard'), ('Premium'), ('Luxury'), ('Economy')
on conflict (name) do nothing;

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  address text,
  region text,
  country text not null default 'Ελλάδα',
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists suppliers_name_lower_idx
  on public.suppliers (lower(trim(name)));

alter table public.suppliers enable row level security;
drop policy if exists "suppliers_all" on public.suppliers;
create policy "suppliers_all" on public.suppliers
  for all to authenticated using (true) with check (true);
grant select, insert, update, delete on public.suppliers to authenticated;

drop trigger if exists suppliers_updated_at on public.suppliers;
create trigger suppliers_updated_at
  before update on public.suppliers
  for each row execute function public.set_updated_at();

alter table public.products
  add column if not exists quality_grade text,
  add column if not exists supplier_id uuid references public.suppliers (id) on delete set null;

create index if not exists products_supplier_id_idx on public.products (supplier_id);
