-- Line-item color for picking (warehouse reads order_items.color_id)

alter table public.order_items
  add column if not exists color_id uuid references public.product_colors (id) on delete set null;

create index if not exists order_items_color_id_idx
  on public.order_items (color_id);
