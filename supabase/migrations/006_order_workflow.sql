-- Order workflow: ready for shipment status + driver assignment
-- Run after 005_partial_delivery_reservations.sql

alter table public.orders drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (
    status in (
      'Σε Επεξεργασία',
      'Επιβεβαιώθηκε',
      'Έτοιμο για Αποστολή',
      'Δεσμευμένη',
      'Μερική Αποστολή',
      'Αποστολή',
      'Ολοκληρώθηκε',
      'Αναμονή πληρωμής',
      'Ακυρώθηκε'
    )
  );

alter table public.orders
  add column if not exists assigned_driver_id uuid references auth.users (id) on delete set null;

alter table public.orders
  add column if not exists assigned_driver_name text;

create index if not exists orders_assigned_driver_id_idx
  on public.orders (assigned_driver_id);
