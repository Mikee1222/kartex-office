-- POD completion fields for office real-time sync

alter table public.orders
  add column if not exists delivery_notes text,
  add column if not exists delivered_at timestamptz;

create index if not exists orders_delivered_at_idx on public.orders (delivered_at);
