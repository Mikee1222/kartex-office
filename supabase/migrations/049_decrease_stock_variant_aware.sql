-- Variant-aware stock deduction + optional color targeting (shipment / partial delivery).
-- Warehouse pick flow uses confirm_pick_item; callers here must skip lines with picked_at set.

create or replace function public.decrease_stock(
  p_product_id uuid,
  p_quantity int,
  p_color_id uuid default null
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

  if p_product_id is null or p_quantity is null or p_quantity <= 0 then
    return;
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
    order by is_primary desc nulls last, created_at
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

    return;
  end if;

  select stock
  into v_product_stock
  from public.products
  where id = p_product_id;

  if not found then
    return;
  end if;

  update public.products
  set stock = greatest(0, v_product_stock - v_qty)
  where id = p_product_id;
end;
$$;

grant execute on function public.decrease_stock(uuid, int, uuid) to authenticated;
