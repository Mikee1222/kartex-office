-- Portal order customer snapshot + quote link for order detail display

alter table public.orders
  add column if not exists quote_request_id uuid references public.quote_requests (id) on delete set null,
  add column if not exists customer_name text,
  add column if not exists customer_phone text,
  add column if not exists customer_email text,
  add column if not exists customer_address text,
  add column if not exists company_name text;

alter table public.orders
  alter column customer_id drop not null;

create index if not exists orders_quote_request_id_idx
  on public.orders (quote_request_id);
