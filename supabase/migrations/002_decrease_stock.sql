-- Stock deduction on shipment + RPC helper
-- Run in Supabase SQL Editor after 001_initial_schema.sql

alter table public.orders
  add column if not exists stock_deducted boolean not null default false;

create or replace function public.decrease_stock(p_product_id uuid, p_quantity int)
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
  set stock = greatest(stock - p_quantity, 0)
  where id = p_product_id;
end;
$$;

grant execute on function public.decrease_stock(uuid, int) to authenticated;
