-- Customer portal payment proof + office payment confirmation

alter table public.orders
  add column if not exists payment_status text not null default 'pending'
    constraint orders_payment_status_check
    check (payment_status in ('pending', 'submitted', 'confirmed', 'failed')),
  add column if not exists payment_proof_url text,
  add column if not exists payment_amount numeric(12, 2),
  add column if not exists payment_submitted_at timestamptz,
  add column if not exists payment_confirmed_at timestamptz,
  add column if not exists document_type text default 'receipt'
    constraint orders_document_type_check
    check (document_type in ('receipt', 'invoice')),
  add column if not exists vat_number text,
  add column if not exists billing_address text;

create index if not exists orders_payment_status_idx
  on public.orders (payment_status)
  where payment_status = 'submitted';
