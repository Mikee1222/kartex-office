-- Website analytics: sessions, pageviews, events + quote attribution

create table if not exists public.analytics_sessions (
  id uuid primary key default gen_random_uuid(),
  session_id text unique not null,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  ended_at timestamptz,
  ip_anonymized text,
  user_agent text,
  device_type text,
  browser text,
  os text,
  country text,
  referrer text,
  landing_page text,
  locale text
);

create table if not exists public.analytics_pageviews (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references public.analytics_sessions (session_id) on delete cascade,
  path text not null,
  viewed_at timestamptz not null default now(),
  time_on_page_seconds integer
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references public.analytics_sessions (session_id) on delete cascade,
  event_type text not null,
  event_target text,
  path text,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

alter table public.quote_requests
  add column if not exists session_id text references public.analytics_sessions (session_id) on delete set null;

create index if not exists analytics_sessions_session_id_idx
  on public.analytics_sessions (session_id);

create index if not exists analytics_sessions_last_seen_at_idx
  on public.analytics_sessions (last_seen_at desc);

create index if not exists analytics_sessions_started_at_idx
  on public.analytics_sessions (started_at desc);

create index if not exists analytics_pageviews_session_id_idx
  on public.analytics_pageviews (session_id);

create index if not exists analytics_pageviews_viewed_at_idx
  on public.analytics_pageviews (viewed_at desc);

create index if not exists analytics_pageviews_path_idx
  on public.analytics_pageviews (path);

create index if not exists analytics_events_session_id_idx
  on public.analytics_events (session_id);

create index if not exists analytics_events_occurred_at_idx
  on public.analytics_events (occurred_at desc);

create index if not exists analytics_events_event_type_idx
  on public.analytics_events (event_type);

create index if not exists quote_requests_session_id_idx
  on public.quote_requests (session_id);

alter table public.analytics_sessions enable row level security;
alter table public.analytics_pageviews enable row level security;
alter table public.analytics_events enable row level security;

-- Website visitors may insert via anon key (defense-in-depth; API uses service role)
create policy "analytics_sessions_anon_insert"
  on public.analytics_sessions for insert to anon
  with check (true);

create policy "analytics_pageviews_anon_insert"
  on public.analytics_pageviews for insert to anon
  with check (true);

create policy "analytics_events_anon_insert"
  on public.analytics_events for insert to anon
  with check (true);

-- Office authenticated users can read analytics (single-tenant MVP pattern)
create policy "analytics_sessions_select_authenticated"
  on public.analytics_sessions for select to authenticated
  using (true);

create policy "analytics_pageviews_select_authenticated"
  on public.analytics_pageviews for select to authenticated
  using (true);

create policy "analytics_events_select_authenticated"
  on public.analytics_events for select to authenticated
  using (true);

grant insert on public.analytics_sessions to anon;
grant insert on public.analytics_pageviews to anon;
grant insert on public.analytics_events to anon;

grant select on public.analytics_sessions to authenticated;
grant select on public.analytics_pageviews to authenticated;
grant select on public.analytics_events to authenticated;
