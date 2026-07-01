-- Schedule: warehouse picking date + delivery reminder lead time

alter table public.orders
  add column if not exists picking_date date,
  add column if not exists reminder_days integer not null default 2
    constraint orders_reminder_days_check check (reminder_days >= 0 and reminder_days <= 90);

create index if not exists orders_picking_date_idx on public.orders (picking_date);
create index if not exists orders_delivery_date_idx on public.orders (delivery_date);
