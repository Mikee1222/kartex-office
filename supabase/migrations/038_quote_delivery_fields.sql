-- Delivery method and address/pickup fields for quote requests and orders

alter table public.quote_requests
  add column if not exists delivery_method text,
  add column if not exists delivery_recipient_name text,
  add column if not exists delivery_address text,
  add column if not exists delivery_city text,
  add column if not exists delivery_postal_code text,
  add column if not exists pickup_agency text;

alter table public.orders
  add column if not exists delivery_method text,
  add column if not exists delivery_recipient_name text,
  add column if not exists delivery_address text,
  add column if not exists delivery_city text,
  add column if not exists delivery_postal_code text,
  add column if not exists pickup_agency text;

alter table public.quote_requests
  drop constraint if exists quote_requests_delivery_method_check;
alter table public.quote_requests
  add constraint quote_requests_delivery_method_check
  check (delivery_method is null or delivery_method in ('address', 'pickup'));

alter table public.orders
  drop constraint if exists orders_delivery_method_check;
alter table public.orders
  add constraint orders_delivery_method_check
  check (delivery_method is null or delivery_method in ('address', 'pickup'));

alter table public.quote_requests
  drop constraint if exists quote_requests_delivery_address_fields_check;
alter table public.quote_requests
  add constraint quote_requests_delivery_address_fields_check
  check (
    delivery_method is null
    or delivery_method = 'pickup'
    or (
      delivery_method = 'address'
      and delivery_recipient_name is not null
      and trim(delivery_recipient_name) <> ''
      and delivery_address is not null
      and trim(delivery_address) <> ''
      and delivery_city is not null
      and trim(delivery_city) <> ''
      and delivery_postal_code is not null
      and trim(delivery_postal_code) <> ''
      and pickup_agency is null
    )
  );

alter table public.quote_requests
  drop constraint if exists quote_requests_delivery_pickup_fields_check;
alter table public.quote_requests
  add constraint quote_requests_delivery_pickup_fields_check
  check (
    delivery_method is null
    or delivery_method = 'address'
    or (
      delivery_method = 'pickup'
      and delivery_recipient_name is not null
      and trim(delivery_recipient_name) <> ''
      and pickup_agency is not null
      and trim(pickup_agency) <> ''
      and delivery_address is null
      and delivery_city is null
      and delivery_postal_code is null
    )
  );

alter table public.orders
  drop constraint if exists orders_delivery_address_fields_check;
alter table public.orders
  add constraint orders_delivery_address_fields_check
  check (
    delivery_method is null
    or delivery_method = 'pickup'
    or (
      delivery_method = 'address'
      and delivery_recipient_name is not null
      and trim(delivery_recipient_name) <> ''
      and delivery_address is not null
      and trim(delivery_address) <> ''
      and delivery_city is not null
      and trim(delivery_city) <> ''
      and delivery_postal_code is not null
      and trim(delivery_postal_code) <> ''
      and pickup_agency is null
    )
  );

alter table public.orders
  drop constraint if exists orders_delivery_pickup_fields_check;
alter table public.orders
  add constraint orders_delivery_pickup_fields_check
  check (
    delivery_method is null
    or delivery_method = 'address'
    or (
      delivery_method = 'pickup'
      and delivery_recipient_name is not null
      and trim(delivery_recipient_name) <> ''
      and pickup_agency is not null
      and trim(pickup_agency) <> ''
      and delivery_address is null
      and delivery_city is null
      and delivery_postal_code is null
    )
  );
