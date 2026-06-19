-- Website product categories & subcategories (public catalog navigation)

create table if not exists public.website_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.website_subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.website_categories (id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint website_subcategories_category_slug_unique unique (category_id, slug)
);

create index if not exists website_categories_sort_order_idx
  on public.website_categories (sort_order);

create index if not exists website_subcategories_category_id_idx
  on public.website_subcategories (category_id, sort_order);

drop trigger if exists website_categories_set_updated_at on public.website_categories;
create trigger website_categories_set_updated_at
  before update on public.website_categories
  for each row execute function public.set_updated_at();

drop trigger if exists website_subcategories_set_updated_at on public.website_subcategories;
create trigger website_subcategories_set_updated_at
  before update on public.website_subcategories
  for each row execute function public.set_updated_at();

alter table public.website_categories enable row level security;
alter table public.website_subcategories enable row level security;

drop policy if exists "website_categories_authenticated_all" on public.website_categories;
create policy "website_categories_authenticated_all" on public.website_categories
  for all to authenticated using (true) with check (true);

drop policy if exists "website_categories_anon_select_active" on public.website_categories;
create policy "website_categories_anon_select_active" on public.website_categories
  for select to anon using (is_active = true);

drop policy if exists "website_subcategories_authenticated_all" on public.website_subcategories;
create policy "website_subcategories_authenticated_all" on public.website_subcategories
  for all to authenticated using (true) with check (true);

drop policy if exists "website_subcategories_anon_select_active" on public.website_subcategories;
create policy "website_subcategories_anon_select_active" on public.website_subcategories
  for select to anon using (is_active = true);

grant select, insert, update, delete on public.website_categories to authenticated;
grant select, insert, update, delete on public.website_subcategories to authenticated;
grant select on public.website_categories to anon;
grant select on public.website_subcategories to anon;

-- Seed from legacy hardcoded website catalog
insert into public.website_categories (name, slug, description, image_url, sort_order)
values
  (
    'Πετσέτες',
    'πετσέτες',
    'Μπάνιου, πισίνας & χεριών',
    'https://images.unsplash.com/photo-1563178406-4cdc2923acbc?w=600&q=80',
    1
  ),
  (
    'Σεντόνια',
    'σεντόνια',
    'Μονά, διπλά & king size',
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80',
    2
  ),
  (
    'Μαξιλαροθήκες',
    'μαξιλαροθήκες',
    'Oxford 3 & 4 side',
    'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&q=80',
    3
  ),
  (
    'Παπλωματοθήκες',
    'παπλωματοθήκες',
    'Satin stripe & standard',
    'https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=600&q=80',
    4
  ),
  (
    'Πατάκια',
    'πατάκια',
    'Diamond, Frame & Bedmat',
    'https://images.unsplash.com/photo-1620626011761-996317702782?w=600&q=80',
    5
  ),
  (
    'Τραπεζομάντηλα',
    'τραπεζομάντηλα',
    'Ναπερόν & τραπεζομάντηλα',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80',
    6
  ),
  (
    'Υφάσματα',
    'υφάσματα',
    'Satin, CVC & cotton',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    7
  )
on conflict (slug) do nothing;

insert into public.website_subcategories (category_id, name, slug, description, image_url, sort_order)
select c.id, v.name, v.slug, v.description, v.image_url, v.sort_order
from public.website_categories c
join (
  values
    ('Πετσέτες', 'Μπάνιου', 'μπάνιου', 'Πετσέτες για επαγγελματική χρήση', 'https://images.unsplash.com/photo-1563178406-4cdc2923acbc?w=600&q=80', 1),
    ('Πετσέτες', 'Πισίνας', 'πισίνας', 'Pool towels & beach towels', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80', 2),
    ('Πετσέτες', 'Χεριών & Προσώπου', 'χεριών-προσώπου', 'Χεριών, προσώπου & guest towels', 'https://images.unsplash.com/photo-1600369672770-985fd30004eb?w=600&q=80', 3),
    ('Σεντόνια', 'Μονά & Ημίδιπλα', 'μονά-ημίδιπλα', 'Για μονά κρεβάτια', 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80', 1),
    ('Σεντόνια', 'Διπλά & King Size', 'διπλά-king-size', 'Για διπλά & king size', 'https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=600&q=80', 2),
    ('Μαξιλαροθήκες', 'Oxford 4 Side', 'oxford-4-side', 'Με φλάντζα 4 πλευρών', 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&q=80', 1),
    ('Μαξιλαροθήκες', 'Oxford 3 Side', 'oxford-3-side', 'Με φλάντζα 3 πλευρών', 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&q=80', 2),
    ('Μαξιλαροθήκες', 'Standard', 'standard', 'Κλασικές μαξιλαροθήκες', 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&q=80', 3),
    ('Παπλωματοθήκες', 'Satin Stripe', 'satin-stripe', 'Satin stripe υφή', 'https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=600&q=80', 1),
    ('Παπλωματοθήκες', 'Standard', 'standard', 'Κλασικές παπλωματοθήκες', 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80', 2),
    ('Πατάκια', 'Diamond', 'diamond', 'Diamond pattern', 'https://images.unsplash.com/photo-1620626011761-996317702782?w=600&q=80', 1),
    ('Πατάκια', 'Frame', 'frame', 'Frame design', 'https://images.unsplash.com/photo-1620626011761-996317702782?w=600&q=80', 2),
    ('Πατάκια', 'Standard', 'standard', 'Κλασικά πατάκια', 'https://images.unsplash.com/photo-1620626011761-996317702782?w=600&q=80', 3),
    ('Τραπεζομάντηλα', 'Τραπεζομάντηλα', 'τραπεζομάντηλα', 'Satin band τραπεζομάντηλα', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80', 1),
    ('Τραπεζομάντηλα', 'Ναπερόν', 'ναπερόν', 'Τετράγωνα ναπερόν', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80', 2),
    ('Τραπεζομάντηλα', 'Πετσέτες Φαγητού', 'πετσέτες-φαγητού', 'Πετσέτες τραπεζιού', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80', 3),
    ('Υφάσματα', 'Satin Plain', 'satin-plain', 'Λείο satin ύφασμα', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', 1),
    ('Υφάσματα', 'Satin Stripe', 'satin-stripe', 'Ριγέ satin ύφασμα', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', 2),
    ('Υφάσματα', 'Satin', 'satin', 'Satin υφάσματα', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', 3),
    ('Υφάσματα', 'Standard', 'standard', 'CVC & P/C υφάσματα', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', 4)
) as v(category_name, name, slug, description, image_url, sort_order)
  on c.name = v.category_name
on conflict (category_id, slug) do nothing;
