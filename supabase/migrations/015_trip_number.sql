-- Per-driver per-day trip sequence (Δρομολόγιο #1, #2, …)

alter table public.delivery_trips
  add column if not exists trip_number integer;

with numbered as (
  select
    id,
    row_number() over (
      partition by driver_id, trip_date
      order by created_at asc
    )::integer as num
  from public.delivery_trips
  where trip_number is null
)
update public.delivery_trips as t
set trip_number = numbered.num
from numbered
where t.id = numbered.id;

update public.delivery_trips
set trip_number = 1
where trip_number is null;

alter table public.delivery_trips
  alter column trip_number set not null;

alter table public.delivery_trips
  add constraint delivery_trips_trip_number_positive
  check (trip_number > 0);

create unique index if not exists delivery_trips_driver_date_number_idx
  on public.delivery_trips (driver_id, trip_date, trip_number);
