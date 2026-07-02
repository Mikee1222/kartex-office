# Schedule → Trips Merge Deliverable

## Before state (Πρόγραμμα vs Δρομολόγια)

### Πρόγραμμα (`/schedule`)
- **Route:** `app/(dashboard)/schedule/page.tsx` → `ScheduleView`
- **Data:** All orders with `picking_date` / `delivery_date` (passive calendar, not tied to `delivery_trips`)
- **Views:** Μήνας / Εβδομάδα / Λίστα via `react-big-calendar`
- **Components:** `components/schedule/*`, `lib/schedule/*`
- **Picking timing:** Synthetic morning/afternoon slots (08:00 picking, 14:00 delivery)
- **Trips overlay:** Read-only trip events from `delivery_trips` but no CRUD from calendar

### Δρομολόγια (`/trips`)
- **Route:** `app/(dashboard)/trips/page.tsx` → `TripsPage`
- **Data:** `delivery_trips` grouped by driver for a single selected date
- **CRUD:** Create trip, add/remove orders, reorder route (`delivery_sequence`), start/complete
- **API:** `/api/trips`, `/api/trips/[id]/start|complete|reorder|orders`
- **Visual:** Driver sections, expandable `TripDetail`, capacity bars, status badges

---

## After state (merged into Δρομολόγια)

### Single surface: `/trips`
| View | Purpose |
|------|---------|
| **Ημέρα** | Operational day board (unchanged CRUD) |
| **Μήνας** | Calendar: trips + unassigned orders |
| **Εβδομάδα** | Drag trips → `trip_date`; unassigned → `picking_date` / `delivery_date` |
| **Λίστα** | Filterable table of trips + unassigned |

### Calendar data model
- **Primary events:** `delivery_trips` (trip_date, driver, status, departed_at for real timing)
- **Secondary events:** Orders with dates but `trip_id IS NULL` — dashed border styling
- **Picking status:** `order_items.picked_at` (latest timestamp + picked/total counts)

### Retired `/schedule`
- Redirects to `/trips?view=month` (preserves `view` + `date`/`listDate` query params)
- Nav: single **Δρομολόγια** item (Πρόγραμμα removed)
- `UpcomingOrdersWidget`, `ScheduleBell`, alerts → `/trips` links
- Breadcrumb `schedule` → labels as Δρομολόγια

### `driver_schedules`
- **Removed** legacy write from `assign-driver-to-order.ts`
- **Capacity reads** now sum `delivery_trips.total_boxes` per driver/date
- Table retained in DB for historical data only

### Premium UI
- KPI row: trips today, unassigned count, picking backlog
- `premiumStatCard`, last-updated pulse, `EmptyState` on day view

---

## Checkpoint

- [x] Merged view modes in TripsPage
- [x] Unassigned orders visually distinct (dashed borders, separate event types)
- [x] Week drag for trips and unassigned dates
- [x] `/schedule` redirect
- [x] Nav/widgets/bell updated
- [x] `order_items.picked_at` for picking progress
- [x] Typecheck + build

---

## Key files

| Area | Files |
|------|-------|
| Page | `components/trips/trips-page.tsx` |
| Calendar views | `components/trips/trips-{month,week,list,day-panel}-view.tsx` |
| Calendar lib | `lib/trips/calendar-{types,utils}.ts`, `fetch-trips-calendar.ts` |
| Trip date API | `app/api/trips/[id]/route.ts` (PATCH) |
| Redirect | `app/(dashboard)/schedule/page.tsx` |
| Capacity | `lib/orders/assign-driver-to-order.ts` |
