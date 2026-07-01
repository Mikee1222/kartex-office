-- Backfill products.clean_name and products.category from linked product_masters.
-- Pre-migration stale count (2026-07-02): 224 rows
--   WHERE master_id IS NOT NULL AND (
--     clean_name IS DISTINCT FROM pm.clean_name OR
--     category IS DISTINCT FROM pm.category OR
--     clean_name IS NULL OR category IS NULL
--   )

update public.products p
set
  clean_name = pm.clean_name,
  category = pm.category,
  updated_at = now()
from public.product_masters pm
where p.master_id = pm.id
  and (
    p.clean_name is distinct from pm.clean_name
    or p.category is distinct from pm.category
    or p.clean_name is null
    or p.category is null
  );
