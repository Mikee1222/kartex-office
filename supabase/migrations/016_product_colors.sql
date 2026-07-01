-- Product colors catalog + per-product color variants + dimensions

create table if not exists public.product_colors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  hex_code text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_colors_hex_format check (hex_code ~ '^#[0-9A-Fa-f]{6}$')
);

create unique index if not exists product_colors_name_lower_idx
  on public.product_colors (lower(trim(name)));

alter table public.products
  add column if not exists width_cm numeric(10, 2),
  add column if not exists height_cm numeric(10, 2),
  add column if not exists weight_kg numeric(10, 3),
  add column if not exists unit text not null default 'τεμ',
  add column if not exists is_active boolean not null default true;

create table if not exists public.product_color_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  color_id uuid not null references public.product_colors (id) on delete restrict,
  stock integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_color_variants_stock_non_negative check (stock >= 0),
  constraint product_color_variants_product_color_unique unique (product_id, color_id)
);

create index if not exists product_color_variants_product_id_idx
  on public.product_color_variants (product_id);

create index if not exists product_color_variants_color_id_idx
  on public.product_color_variants (color_id);

alter table public.inventory_movements
  add column if not exists color_id uuid references public.product_colors (id) on delete set null;

-- updated_at triggers
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists product_colors_updated_at on public.product_colors;
create trigger product_colors_updated_at
  before update on public.product_colors
  for each row execute function public.set_updated_at();

drop trigger if exists product_color_variants_updated_at on public.product_color_variants;
create trigger product_color_variants_updated_at
  before update on public.product_color_variants
  for each row execute function public.set_updated_at();

alter table public.product_colors enable row level security;
alter table public.product_color_variants enable row level security;

create policy "product_colors_select_authenticated"
  on public.product_colors for select to authenticated using (true);

create policy "product_colors_insert_authenticated"
  on public.product_colors for insert to authenticated with check (true);

create policy "product_colors_update_authenticated"
  on public.product_colors for update to authenticated using (true);

create policy "product_colors_delete_authenticated"
  on public.product_colors for delete to authenticated using (true);

create policy "product_color_variants_select_authenticated"
  on public.product_color_variants for select to authenticated using (true);

create policy "product_color_variants_insert_authenticated"
  on public.product_color_variants for insert to authenticated with check (true);

create policy "product_color_variants_update_authenticated"
  on public.product_color_variants for update to authenticated using (true);

create policy "product_color_variants_delete_authenticated"
  on public.product_color_variants for delete to authenticated using (true);
