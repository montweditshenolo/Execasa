CREATE TABLE public.room_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL DEFAULT auth.uid(),
  reported_id uuid NOT NULL,
  reported_name text,
  room text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.room_reports TO authenticated;
GRANT ALL ON public.room_reports TO service_role;
ALTER TABLE public.room_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY room_reports_insert_own ON public.room_reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
CREATE POLICY room_reports_read_own ON public.room_reports FOR SELECT TO authenticated USING (reporter_id = auth.uid());