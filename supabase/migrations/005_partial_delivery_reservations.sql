-- Partial deliveries, stock reservations, extended order statuses
-- Run after 004_user_roles.sql

-- ---------------------------------------------------------------------------
-- Extended order statuses
-- ---------------------------------------------------------------------------
alter table public.orders drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (
    status in (
      'Σε Επεξεργασία',
      'Επιβεβαιώθηκε',
      'Δεσμευμένη',
      'Μερική Αποστολή',
      'Αποστολή',
      'Ολοκληρώθηκε',
      'Αναμονή πληρωμής',
      'Ακυρώθηκε'
    )
  );

-- ---------------------------------------------------------------------------
-- Reservations on orders
-- ---------------------------------------------------------------------------
alter table public.orders
  add column if not exists is_reserved boolean not null default false;

alter table public.orders
  add column if not exists reserved_until date;

-- ---------------------------------------------------------------------------
-- Delivered quantities on line items
-- ---------------------------------------------------------------------------
alter table public.order_items
  add column if not exists quantity_delivered integer not null default 0;

alter table public.order_items
  drop constraint if exists order_items_delivered_lte_quantity;

alter table public.order_items
  add constraint order_items_delivered_lte_quantity
  check (quantity_delivered >= 0 and quantity_delivered <= quantity);

-- ---------------------------------------------------------------------------
-- Reserved stock on products
-- ---------------------------------------------------------------------------
alter table public.products
  add column if not exists reserved_stock integer not null default 0;

alter table public.products
  drop constraint if exists products_reserved_non_negative;

alter table public.products
  add constraint products_reserved_non_negative
  check (reserved_stock >= 0);

-- ---------------------------------------------------------------------------
-- Deliveries
-- ---------------------------------------------------------------------------
create table if not exists public.deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id) on delete set null
);

create index if not exists deliveries_order_id_idx on public.deliveries (order_id);
create index if not exists deliveries_created_at_idx on public.deliveries (created_at desc);

create table if not exists public.delivery_items (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.deliveries (id) on delete cascade,
  order_item_id uuid not null references public.order_items (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  quantity integer not null
    constraint delivery_items_quantity_positive check (quantity > 0)
);

create index if not exists delivery_items_delivery_id_idx
  on public.delivery_items (delivery_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.deliveries enable row level security;
alter table public.delivery_items enable row level security;

create policy "deliveries_select_authenticated"
  on public.deliveries for select to authenticated using (true);
create policy "deliveries_insert_authenticated"
  on public.deliveries for insert to authenticated with check (true);
create policy "deliveries_update_authenticated"
  on public.deliveries for update to authenticated using (true) with check (true);
create policy "deliveries_delete_authenticated"
  on public.deliveries for delete to authenticated using (true);

create policy "delivery_items_select_authenticated"
  on public.delivery_items for select to authenticated using (true);
create policy "delivery_items_insert_authenticated"
  on public.delivery_items for insert to authenticated with check (true);
create policy "delivery_items_update_authenticated"
  on public.delivery_items for update to authenticated using (true) with check (true);
create policy "delivery_items_delete_authenticated"
  on public.delivery_items for delete to authenticated using (true);

grant select, insert, update, delete on public.deliveries to authenticated;
grant select, insert, update, delete on public.delivery_items to authenticated;

-- ---------------------------------------------------------------------------
-- Stock RPCs
-- ---------------------------------------------------------------------------
create or replace function public.reserve_stock(p_product_id uuid, p_quantity int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_available int;
begin
  if p_product_id is null or p_quantity is null or p_quantity <= 0 then
    return;
  end if;

  select (stock - reserved_stock) into v_available
  from public.products
  where id = p_product_id
  for update;

  if v_available is null then
    raise exception 'product_not_found';
  end if;

  if v_available < p_quantity then
    raise exception 'insufficient_available_stock';
  end if;

  update public.products
  set reserved_stock = reserved_stock + p_quantity
  where id = p_product_id;
end;
$$;

create or replace function public.release_reserved_stock(p_product_id uuid, p_quantity int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_product_id is null or p_quantity is null or p_quantity <= 0 then
    return;
  end if;

  update public.products
  set reserved_stock = greatest(reserved_stock - p_quantity, 0)
  where id = p_product_id;
end;
$$;

grant execute on function public.reserve_stock(uuid, int) to authenticated;
grant execute on function public.release_reserved_stock(uuid, int) to authenticated;
