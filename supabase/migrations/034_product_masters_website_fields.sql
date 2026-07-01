-- Website CMS fields on product masters and variant internal pricing

alter table public.product_masters
  add column if not exists image_url text;

alter table public.products
  add column if not exists internal_price_eur numeric(10, 2);
