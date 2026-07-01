-- Scheduled orders: status when picking_date is set at creation

alter table public.orders drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (
    status in (
      'Σε Επεξεργασία',
      'Προγραμματισμένη',
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
