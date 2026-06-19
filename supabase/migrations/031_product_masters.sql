-- Product masters + variant linkage on products

create table if not exists public.product_masters (
  id uuid primary key default gen_random_uuid(),
  clean_name text not null,
  category text not null,
  subcategory text,
  quality_grade text,
  material text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger product_masters_set_updated_at
  before update on public.product_masters
  for each row execute function public.set_updated_at();

alter table public.products
  add column if not exists clean_name text,
  add column if not exists subcategory text;

alter table public.products
  add column if not exists master_id uuid references public.product_masters (id) on delete set null;

create index if not exists products_master_id_idx on public.products (master_id)
  where master_id is not null;

create index if not exists products_clean_name_idx on public.products (clean_name)
  where clean_name is not null;

alter table public.product_masters enable row level security;

drop policy if exists "product_masters_all" on public.product_masters;
create policy "product_masters_all" on public.product_masters
  for all to authenticated using (true) with check (true);

grant select, insert, update, delete on public.product_masters to authenticated;
