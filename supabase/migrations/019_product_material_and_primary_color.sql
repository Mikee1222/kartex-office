-- Product material + primary color variant flag

alter table public.products
  add column if not exists material text;

alter table public.product_color_variants
  add column if not exists is_primary boolean not null default false;
