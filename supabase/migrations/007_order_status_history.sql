-- Status change audit trail for order timeline timestamps.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS status_history JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN orders.status_history IS
  'Array of { status, changed_at, changed_by } entries appended on each status change.';
