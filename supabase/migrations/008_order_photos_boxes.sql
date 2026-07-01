-- Box photos + order metadata for warehouse picking

alter table public.orders
  add column if not exists boxes_count integer,
  add column if not exists boxes_notes text;

create table if not exists public.order_photos (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  photo_url text not null,
  photo_type text not null default 'box'
    constraint order_photos_type_check check (photo_type in ('box', 'package')),
  box_number integer,
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id) on delete set null
);

create index if not exists order_photos_order_id_idx on public.order_photos (order_id);
create index if not exists order_photos_box_idx on public.order_photos (order_id, box_number);

alter table public.order_photos enable row level security;

create policy "order_photos_select_authenticated"
  on public.order_photos for select to authenticated using (true);

create policy "order_photos_insert_authenticated"
  on public.order_photos for insert to authenticated with check (true);

create policy "order_photos_delete_authenticated"
  on public.order_photos for delete to authenticated using (true);

-- Storage bucket for order/box photos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'order-photos',
  'order-photos',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "order_photos_storage_select"
  on storage.objects for select to authenticated
  using (bucket_id = 'order-photos');

create policy "order_photos_storage_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'order-photos'
    and (storage.foldername(name))[1] = 'orders'
  );

create policy "order_photos_storage_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'order-photos');

-- Realtime for orders list in warehouse app
do $$
begin
  alter publication supabase_realtime add table public.orders;
exception
  when duplicate_object then null;
end $$;
