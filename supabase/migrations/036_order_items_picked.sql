-- Pick progress on order line items (warehouse pick flow)

alter table public.order_items
  add column if not exists picked_at timestamptz,
  add column if not exists picked_by uuid references auth.users (id) on delete set null;

create index if not exists order_items_picked_at_idx
  on public.order_items (picked_at)
  where picked_at is not null;

-- Atomic pick confirm: stock deduction + movement log + picked_at in one transaction
create or replace function public.confirm_pick_item(
  p_order_item_id uuid,
  p_product_id uuid,
  p_color_id uuid,
  p_quantity int,
  p_order_id uuid,
  p_picked_by uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_qty int;
  v_variant_id uuid;
  v_variant_stock int;
  v_product_stock int;
begin
  v_qty := greatest(1, round(p_quantity));

  if exists (
    select 1 from public.order_items
    where id = p_order_item_id and picked_at is not null
  ) then
    raise exception 'Item already picked';
  end if;

  if p_color_id is not null then
    select id, stock
    into v_variant_id, v_variant_stock
    from public.product_color_variants
    where product_id = p_product_id
      and color_id = p_color_id
      and is_active = true
    limit 1;
  end if;

  if v_variant_id is null then
    select id, stock
    into v_variant_id, v_variant_stock
    from public.product_color_variants
    where product_id = p_product_id
      and is_active = true
    order by created_at
    limit 1;
  end if;

  if v_variant_id is not null then
    update public.product_color_variants
    set stock = greatest(0, v_variant_stock - v_qty)
    where id = v_variant_id;

    update public.products
    set stock = (
      select coalesce(sum(stock), 0)::int
      from public.product_color_variants
      where product_id = p_product_id
        and is_active = true
    )
    where id = p_product_id;
  else
    select stock
    into v_product_stock
    from public.products
    where id = p_product_id;

    if not found then
      raise exception 'Product not found';
    end if;

    update public.products
    set stock = greatest(0, v_product_stock - v_qty)
    where id = p_product_id;
  end if;

  insert into public.inventory_movements (
    product_id,
    type,
    quantity,
    reason,
    order_id,
    created_by,
    color_id
  )
  values (
    p_product_id,
    'out',
    v_qty,
    'Picking παραγγελίας',
    p_order_id,
    p_picked_by,
    p_color_id
  );

  update public.order_items
  set picked_at = timezone('utc', now()),
      picked_by = p_picked_by
  where id = p_order_item_id
    and picked_at is null;

  if not found then
    raise exception 'Order item not found or already picked';
  end if;
end;
$$;

grant execute on function public.confirm_pick_item(uuid, uuid, uuid, int, uuid, uuid)
  to authenticated;
