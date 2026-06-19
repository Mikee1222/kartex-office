-- Quote request pricing fields for office quote management

alter table public.quote_request_items
  add column if not exists quoted_price numeric(10, 2),
  add column if not exists quoted_notes text;

alter table public.quote_requests
  add column if not exists internal_notes text,
  add column if not exists quoted_at timestamptz,
  add column if not exists responded_by uuid references auth.users(id);

grant select, update on public.quote_requests to authenticated;
grant select, update on public.quote_request_items to authenticated;

alter table public.quote_requests enable row level security;
alter table public.quote_request_items enable row level security;

drop policy if exists "quote_requests_select_authenticated" on public.quote_requests;
create policy "quote_requests_select_authenticated"
  on public.quote_requests for select to authenticated using (true);

drop policy if exists "quote_requests_update_authenticated" on public.quote_requests;
create policy "quote_requests_update_authenticated"
  on public.quote_requests for update to authenticated using (true);

drop policy if exists "quote_request_items_select_authenticated" on public.quote_request_items;
create policy "quote_request_items_select_authenticated"
  on public.quote_request_items for select to authenticated using (true);

drop policy if exists "quote_request_items_update_authenticated" on public.quote_request_items;
create policy "quote_request_items_update_authenticated"
  on public.quote_request_items for update to authenticated using (true);

do $$
begin
  alter publication supabase_realtime add table public.quote_requests;
exception
  when duplicate_object then null;
end $$;
