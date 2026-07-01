-- Roles per auth user (app-level RBAC)
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null
    constraint user_roles_role_check
    check (role in ('admin', 'salesperson', 'warehouse', 'driver')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id)
);

create index if not exists user_roles_role_idx on public.user_roles (role);

alter table public.user_roles enable row level security;

-- Users can read their own role (for sidebar / permissions in the app)
create policy "user_roles_select_own"
  on public.user_roles for select to authenticated
  using (auth.uid() = user_id);

-- Admins read/write all rows (must already have admin role in user_roles)
create policy "user_roles_admin_select"
  on public.user_roles for select to authenticated
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  );

create policy "user_roles_admin_insert"
  on public.user_roles for insert to authenticated
  with check (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  );

create policy "user_roles_admin_update"
  on public.user_roles for update to authenticated
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  );

create policy "user_roles_admin_delete"
  on public.user_roles for delete to authenticated
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  );
