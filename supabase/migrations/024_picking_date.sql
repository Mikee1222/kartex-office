-- Scheduled picking date for warehouse schedule view

alter table public.orders
  add column if not exists picking_date date;

create index if not exists orders_picking_date_idx on public.orders (picking_date);
