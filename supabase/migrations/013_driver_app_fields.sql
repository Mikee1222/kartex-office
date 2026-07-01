-- Driver app: route sequence, time window, POD photo types

alter table public.orders
  add column if not exists delivery_sequence integer,
  add column if not exists delivery_time_window text;

create index if not exists orders_delivery_sequence_idx
  on public.orders (assigned_driver_id, delivery_date, delivery_sequence);

alter table public.order_photos drop constraint if exists order_photos_type_check;

alter table public.order_photos
  add constraint order_photos_type_check
  check (photo_type in ('box', 'package', 'delivery', 'signature'));
