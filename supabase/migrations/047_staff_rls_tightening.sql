-- Tighten permissive authenticated RLS to staff-only ERP access.
-- Portal users retain own quote_requests / orders via separate policies.
-- Uses SECURITY DEFINER is_staff() to avoid user_roles policy recursion.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.is_staff(check_user_id uuid default auth.uid())
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = coalesce(check_user_id, auth.uid())
      and ur.role in ('admin', 'salesperson', 'warehouse', 'driver')
  );
$$;

grant execute on function public.is_staff(uuid) to authenticated;

create or replace function public.portal_owns_order(target_order_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.quote_requests qr
    where qr.order_id = target_order_id
      and qr.user_id = auth.uid()
  );
$$;

grant execute on function public.portal_owns_order(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- customers (staff only)
-- ---------------------------------------------------------------------------
drop policy if exists "customers_select_authenticated" on public.customers;
drop policy if exists "customers_insert_authenticated" on public.customers;
drop policy if exists "customers_update_authenticated" on public.customers;
drop policy if exists "customers_delete_authenticated" on public.customers;

create policy "customers_staff_all"
  on public.customers for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- products (staff write; staff or public catalog read)
-- ---------------------------------------------------------------------------
drop policy if exists "products_select_authenticated" on public.products;
drop policy if exists "products_insert_authenticated" on public.products;
drop policy if exists "products_update_authenticated" on public.products;
drop policy if exists "products_delete_authenticated" on public.products;

create policy "products_staff_select"
  on public.products for select to authenticated
  using (public.is_staff() or is_active = true);

create policy "products_staff_insert"
  on public.products for insert to authenticated
  with check (public.is_staff());

create policy "products_staff_update"
  on public.products for update to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy "products_staff_delete"
  on public.products for delete to authenticated
  using (public.is_staff());

-- ---------------------------------------------------------------------------
-- orders (staff ERP + existing portal policies)
-- ---------------------------------------------------------------------------
drop policy if exists "orders_select_authenticated" on public.orders;
drop policy if exists "orders_insert_authenticated" on public.orders;
drop policy if exists "orders_update_authenticated" on public.orders;
drop policy if exists "orders_delete_authenticated" on public.orders;

create policy "orders_staff_select"
  on public.orders for select to authenticated
  using (public.is_staff());

create policy "orders_staff_insert"
  on public.orders for insert to authenticated
  with check (public.is_staff());

create policy "orders_staff_update"
  on public.orders for update to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy "orders_staff_delete"
  on public.orders for delete to authenticated
  using (public.is_staff());

-- ---------------------------------------------------------------------------
-- order_items (staff ERP + portal read on own orders)
-- ---------------------------------------------------------------------------
drop policy if exists "order_items_select_authenticated" on public.order_items;
drop policy if exists "order_items_insert_authenticated" on public.order_items;
drop policy if exists "order_items_update_authenticated" on public.order_items;
drop policy if exists "order_items_delete_authenticated" on public.order_items;

create policy "order_items_staff_all"
  on public.order_items for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy "order_items_portal_select_own"
  on public.order_items for select to authenticated
  using (public.portal_owns_order(order_id));

-- ---------------------------------------------------------------------------
-- deliveries / delivery_items (enable RLS + staff only)
-- ---------------------------------------------------------------------------
alter table public.deliveries enable row level security;
alter table public.delivery_items enable row level security;

drop policy if exists "deliveries_select_authenticated" on public.deliveries;
drop policy if exists "deliveries_insert_authenticated" on public.deliveries;
drop policy if exists "deliveries_update_authenticated" on public.deliveries;
drop policy if exists "deliveries_delete_authenticated" on public.deliveries;

create policy "deliveries_staff_all"
  on public.deliveries for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists "delivery_items_select_authenticated" on public.delivery_items;
drop policy if exists "delivery_items_insert_authenticated" on public.delivery_items;
drop policy if exists "delivery_items_update_authenticated" on public.delivery_items;
drop policy if exists "delivery_items_delete_authenticated" on public.delivery_items;

create policy "delivery_items_staff_all"
  on public.delivery_items for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- inventory_movements
-- ---------------------------------------------------------------------------
drop policy if exists "inventory_movements_select_authenticated" on public.inventory_movements;
drop policy if exists "inventory_movements_insert_authenticated" on public.inventory_movements;
drop policy if exists "movements_all_authenticated" on public.inventory_movements;

create policy "inventory_movements_staff_all"
  on public.inventory_movements for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- delivery_trips
-- ---------------------------------------------------------------------------
drop policy if exists "delivery_trips_select_authenticated" on public.delivery_trips;
drop policy if exists "delivery_trips_insert_authenticated" on public.delivery_trips;
drop policy if exists "delivery_trips_update_authenticated" on public.delivery_trips;
drop policy if exists "delivery_trips_delete_authenticated" on public.delivery_trips;
drop policy if exists "trips_all_authenticated" on public.delivery_trips;

create policy "delivery_trips_staff_all"
  on public.delivery_trips for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- driver_schedules
-- ---------------------------------------------------------------------------
drop policy if exists "driver_schedules_select_authenticated" on public.driver_schedules;
drop policy if exists "driver_schedules_insert_authenticated" on public.driver_schedules;
drop policy if exists "driver_schedules_update_authenticated" on public.driver_schedules;
drop policy if exists "schedules_all" on public.driver_schedules;

create policy "driver_schedules_staff_all"
  on public.driver_schedules for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- vehicles
-- ---------------------------------------------------------------------------
drop policy if exists "vehicles_select_authenticated" on public.vehicles;
drop policy if exists "vehicles_insert_authenticated" on public.vehicles;
drop policy if exists "vehicles_update_authenticated" on public.vehicles;
drop policy if exists "vehicles_all" on public.vehicles;

create policy "vehicles_staff_all"
  on public.vehicles for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- order_photos
-- ---------------------------------------------------------------------------
drop policy if exists "order_photos_select_authenticated" on public.order_photos;
drop policy if exists "order_photos_insert_authenticated" on public.order_photos;
drop policy if exists "order_photos_delete_authenticated" on public.order_photos;
drop policy if exists "photos_all_authenticated" on public.order_photos;

create policy "order_photos_staff_all"
  on public.order_photos for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- product_colors / product_color_variants
-- ---------------------------------------------------------------------------
drop policy if exists "product_colors_select_authenticated" on public.product_colors;
drop policy if exists "product_colors_insert_authenticated" on public.product_colors;
drop policy if exists "product_colors_update_authenticated" on public.product_colors;
drop policy if exists "product_colors_delete_authenticated" on public.product_colors;
drop policy if exists "colors_all" on public.product_colors;

create policy "product_colors_staff_all"
  on public.product_colors for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists "product_color_variants_select_authenticated" on public.product_color_variants;
drop policy if exists "product_color_variants_insert_authenticated" on public.product_color_variants;
drop policy if exists "product_color_variants_update_authenticated" on public.product_color_variants;
drop policy if exists "product_color_variants_delete_authenticated" on public.product_color_variants;
drop policy if exists "variants_all" on public.product_color_variants;

create policy "product_color_variants_staff_all"
  on public.product_color_variants for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- lookup / master data tables
-- ---------------------------------------------------------------------------
drop policy if exists "materials_all" on public.materials;
create policy "materials_staff_all"
  on public.materials for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists "quality_all" on public.quality_grades;
drop policy if exists "quality_grades_all" on public.quality_grades;
create policy "quality_grades_staff_all"
  on public.quality_grades for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists "suppliers_all" on public.suppliers;
create policy "suppliers_staff_all"
  on public.suppliers for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists "customer_type_options_all" on public.customer_type_options;
create policy "customer_type_options_staff_all"
  on public.customer_type_options for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists "payment_term_options_all" on public.payment_term_options;
create policy "payment_term_options_staff_all"
  on public.payment_term_options for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists "categories_all" on public.product_categories;
create policy "product_categories_staff_all"
  on public.product_categories for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists "product_masters_all" on public.product_masters;
create policy "product_masters_staff_all"
  on public.product_masters for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists "product_master_images_all" on public.product_master_images;
create policy "product_master_images_staff_all"
  on public.product_master_images for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists "website_categories_authenticated_all" on public.website_categories;
create policy "website_categories_staff_all"
  on public.website_categories for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists "website_subcategories_authenticated_all" on public.website_subcategories;
create policy "website_subcategories_staff_all"
  on public.website_subcategories for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- settings / z_reports
-- ---------------------------------------------------------------------------
drop policy if exists "settings_authenticated_all" on public.settings;
create policy "settings_staff_all"
  on public.settings for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists "z_reports_all" on public.z_reports;
create policy "z_reports_staff_all"
  on public.z_reports for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- quote_requests (staff + portal own)
-- ---------------------------------------------------------------------------
drop policy if exists "quote_requests_select_authenticated" on public.quote_requests;
drop policy if exists "quote_requests_update_authenticated" on public.quote_requests;
drop policy if exists "quotes_all" on public.quote_requests;

create policy "quote_requests_staff_all"
  on public.quote_requests for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy "quote_requests_select_own"
  on public.quote_requests for select to authenticated
  using (user_id = auth.uid());

create policy "quote_requests_update_own"
  on public.quote_requests for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- quote_request_items (staff + portal own via parent quote)
-- ---------------------------------------------------------------------------
drop policy if exists "quote_request_items_select_authenticated" on public.quote_request_items;
drop policy if exists "quote_request_items_update_authenticated" on public.quote_request_items;
drop policy if exists "quote_items_all" on public.quote_request_items;

create policy "quote_request_items_staff_all"
  on public.quote_request_items for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy "quote_request_items_portal_select_own"
  on public.quote_request_items for select to authenticated
  using (
    exists (
      select 1
      from public.quote_requests qr
      where qr.id = quote_request_items.quote_request_id
        and qr.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- analytics (staff read; anon insert unchanged)
-- ---------------------------------------------------------------------------
drop policy if exists "analytics_sessions_select_authenticated" on public.analytics_sessions;
drop policy if exists "analytics_pageviews_select_authenticated" on public.analytics_pageviews;
drop policy if exists "analytics_events_select_authenticated" on public.analytics_events;

create policy "analytics_sessions_staff_select"
  on public.analytics_sessions for select to authenticated
  using (public.is_staff());

create policy "analytics_pageviews_staff_select"
  on public.analytics_pageviews for select to authenticated
  using (public.is_staff());

create policy "analytics_events_staff_select"
  on public.analytics_events for select to authenticated
  using (public.is_staff());

-- ---------------------------------------------------------------------------
-- contact_messages (staff read; public insert unchanged)
-- ---------------------------------------------------------------------------
drop policy if exists "Authenticated can read contact messages" on public.contact_messages;

create policy "contact_messages_staff_select"
  on public.contact_messages for select to authenticated
  using (public.is_staff());

-- ---------------------------------------------------------------------------
-- web_customers (staff only — portal uses service role APIs)
-- ---------------------------------------------------------------------------
drop policy if exists "web_customers_own" on public.web_customers;

create policy "web_customers_staff_all"
  on public.web_customers for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- web_content / web_settings (public read; staff write)
-- ---------------------------------------------------------------------------
drop policy if exists "web_content_admin" on public.web_content;
create policy "web_content_staff_all"
  on public.web_content for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists "web_settings_admin" on public.web_settings;
create policy "web_settings_staff_all"
  on public.web_settings for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- profiles (own row + staff read all for office)
-- ---------------------------------------------------------------------------
drop policy if exists "Authenticated can read all profiles" on public.profiles;

create policy "profiles_staff_select"
  on public.profiles for select to authenticated
  using (public.is_staff());
