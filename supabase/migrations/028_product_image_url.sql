-- Website product catalog images (managed from Office CMS)

alter table public.products
  add column if not exists image_url text;

-- Storage bucket for website product images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "product_images_storage_select"
  on storage.objects for select to authenticated
  using (bucket_id = 'product-images');

create policy "product_images_storage_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images');

create policy "product_images_storage_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images');

create policy "product_images_storage_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images');

create policy "product_images_storage_public_select"
  on storage.objects for select to anon
  using (bucket_id = 'product-images');
