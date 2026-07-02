-- Dolphin AI: token tracking, anonymous message limits, chat metadata

alter table public.ai_messages
  add column if not exists input_tokens integer,
  add column if not exists output_tokens integer,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists ai_messages_chat_id_created_at_idx
  on public.ai_messages (chat_id, created_at);

create index if not exists ai_chats_user_id_updated_at_idx
  on public.ai_chats (user_id, updated_at desc);

-- Anonymous Dolphin message counter (service role only — no public policies)
create table if not exists public.dolphin_anonymous_usage (
  session_id text primary key,
  message_count integer not null default 0 check (message_count >= 0),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists dolphin_anonymous_usage_updated_at_idx
  on public.dolphin_anonymous_usage (updated_at desc);

alter table public.dolphin_anonymous_usage enable row level security;

-- Aggregate token usage per chat (optional internal reporting)
create or replace view public.dolphin_chat_token_totals as
select
  c.id as chat_id,
  c.user_id,
  c.title,
  coalesce(sum(m.input_tokens), 0)::bigint as total_input_tokens,
  coalesce(sum(m.output_tokens), 0)::bigint as total_output_tokens,
  count(m.id) filter (where m.role = 'assistant') as assistant_messages,
  c.created_at,
  c.updated_at
from public.ai_chats c
left join public.ai_messages m on m.chat_id = c.id
group by c.id, c.user_id, c.title, c.created_at, c.updated_at;

grant select on public.dolphin_chat_token_totals to authenticated;

-- Portal customers may read driver GPS for trips delivering their own orders
drop policy if exists "driver_locations_select_portal_own_order" on public.driver_locations;
create policy "driver_locations_select_portal_own_order"
  on public.driver_locations for select to authenticated
  using (
    trip_id is not null
    and exists (
      select 1
      from public.orders o
      join public.quote_requests qr on qr.order_id = o.id
      where o.trip_id = driver_locations.trip_id
        and qr.user_id = auth.uid()
    )
  );
