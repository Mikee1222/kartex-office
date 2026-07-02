-- Track how each CRM customer was acquired.
alter table public.customers
  add column if not exists source text not null default 'manual'
    constraint customers_source_check
    check (source in ('website', 'phone', 'store', 'manual'));

create index if not exists customers_source_idx on public.customers (source);

create index if not exists customers_email_lower_idx
  on public.customers (lower(trim(email)))
  where email is not null;
