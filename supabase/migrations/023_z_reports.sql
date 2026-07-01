-- Daily Z reports (Ημερήσιο Ζ) + myDATA submission tracking

CREATE TABLE IF NOT EXISTS public.z_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date date NOT NULL UNIQUE,
  total_orders integer NOT NULL DEFAULT 0,
  cancelled_orders integer NOT NULL DEFAULT 0,
  total_revenue numeric(12, 2) NOT NULL DEFAULT 0,
  total_vat numeric(12, 2) NOT NULL DEFAULT 0,
  net_amount numeric(12, 2) NOT NULL DEFAULT 0,
  category_breakdown jsonb NOT NULL DEFAULT '[]'::jsonb,
  customer_type_breakdown jsonb NOT NULL DEFAULT '[]'::jsonb,
  mydata_status text NOT NULL DEFAULT 'pending'
    CONSTRAINT z_reports_mydata_status_check
    CHECK (mydata_status IN ('pending', 'submitted', 'error')),
  mydata_mark text,
  mydata_submitted_at timestamptz,
  mydata_error text,
  issued_at timestamptz,
  issued_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS z_reports_report_date_idx
  ON public.z_reports (report_date DESC);

CREATE INDEX IF NOT EXISTS z_reports_mydata_status_idx
  ON public.z_reports (mydata_status);

CREATE TRIGGER z_reports_set_updated_at
  BEFORE UPDATE ON public.z_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.z_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "z_reports_select_authenticated"
  ON public.z_reports FOR SELECT TO authenticated USING (true);

CREATE POLICY "z_reports_insert_authenticated"
  ON public.z_reports FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "z_reports_update_authenticated"
  ON public.z_reports FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "z_reports_delete_authenticated"
  ON public.z_reports FOR DELETE TO authenticated USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.z_reports TO authenticated;
