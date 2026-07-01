-- Multi-image gallery + marketing description for product masters

alter table public.product_masters
  add column if not exists description text;

create table if not exists public.product_master_images (
  id uuid primary key default gen_random_uuid(),
  master_id uuid not null references public.product_masters (id) on delete cascade,
  url text not null,
  sort_order integer not null default 0,
  alt_text text,
  created_at timestamptz default now()
);

create index if not exists product_master_images_master_id_idx
  on public.product_master_images (master_id, sort_order);

alter table public.product_master_images enable row level security;

drop policy if exists "product_master_images_all" on public.product_master_images;
create policy "product_master_images_all" on public.product_master_images
  for all to authenticated using (true) with check (true);

drop policy if exists "product_master_images_select_public" on public.product_master_images;
create policy "product_master_images_select_public" on public.product_master_images
  for select to anon, authenticated
  using (
    exists (
      select 1
      from public.product_masters pm
      where pm.id = master_id
        and pm.is_active = true
    )
  );

grant select, insert, update, delete on public.product_master_images to authenticated;
grant select on public.product_master_images to anon;

-- Keep product_masters.image_url in sync with the primary gallery image (lowest sort_order)
create or replace function public.sync_product_master_primary_image()
returns trigger
language plpgsql
as $$
declare
  target_master_id uuid;
  primary_url text;
begin
  if tg_op = 'DELETE' then
    target_master_id := old.master_id;
  else
    target_master_id := new.master_id;
  end if;

  select pmi.url
  into primary_url
  from public.product_master_images pmi
  where pmi.master_id = target_master_id
  order by pmi.sort_order asc, pmi.created_at asc
  limit 1;

  update public.product_masters
  set image_url = primary_url
  where id = target_master_id;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists product_master_images_sync_primary on public.product_master_images;
create trigger product_master_images_sync_primary
  after insert or update or delete on public.product_master_images
  for each row execute function public.sync_product_master_primary_image();

-- Backfill legacy single image_url rows into the gallery table
insert into public.product_master_images (master_id, url, sort_order, alt_text)
select pm.id, pm.image_url, 0, pm.clean_name
from public.product_masters pm
where pm.image_url is not null
  and btrim(pm.image_url) <> ''
  and not exists (
    select 1
    from public.product_master_images pmi
    where pmi.master_id = pm.id
  );
