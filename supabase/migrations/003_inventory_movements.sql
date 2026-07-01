-- Inventory movement log
create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products (id) on delete set null,
  type text not null
    constraint inventory_movements_type_check
    check (type in ('in', 'out', 'adjustment')),
  quantity integer not null,
  reason text,
  order_id uuid references public.orders (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists inventory_movements_product_id_idx
  on public.inventory_movements (product_id);
create index if not exists inventory_movements_order_id_idx
  on public.inventory_movements (order_id);
create index if not exists inventory_movements_created_at_idx
  on public.inventory_movements (created_at desc);

alter table public.inventory_movements enable row level security;

create policy "inventory_movements_select_authenticated"
  on public.inventory_movements for select to authenticated using (true);

create policy "inventory_movements_insert_authenticated"
  on public.inventory_movements for insert to authenticated with check (true);
