-- Link product masters to materials catalog (keep legacy material text column)

alter table public.product_masters
  add column if not exists material_id uuid references public.materials (id) on delete set null;

create index if not exists product_masters_material_id_idx
  on public.product_masters (material_id)
  where material_id is not null;

-- Canonical materials catalog (deactivate legacy seed rows, ensure required names exist)
update public.materials
set is_active = false
where name in (
  'Μικροΐνες',
  'Μικροΐνα',
  'Μεταξωτό',
  'Bamboo',
  'Λινό',
  'Μείγμα',
  'Πολυέστερ',
  'Άλλο'
);

insert into public.materials (name)
values
  ('Βαμβάκι'),
  ('Πολυεστέρας'),
  ('Μικτό Βαμβάκι-Πολυεστέρας'),
  ('Spandex'),
  ('Άλλο/Άγνωστο')
on conflict (name) do update
set is_active = true;
