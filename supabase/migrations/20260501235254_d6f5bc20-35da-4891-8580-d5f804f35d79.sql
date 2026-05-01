-- 1. Google Calendar connections (per-user OAuth tokens)
CREATE TABLE public.google_calendar_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  google_email text NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  scope text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.google_calendar_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own google connection"
  ON public.google_calendar_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert their own google connection"
  ON public.google_calendar_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update their own google connection"
  ON public.google_calendar_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete their own google connection"
  ON public.google_calendar_connections FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all google connections"
  ON public.google_calendar_connections FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_google_calendar_connections_updated
  BEFORE UPDATE ON public.google_calendar_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Extend scheduled_calls with real Google Meet/Calendar fields
ALTER TABLE public.scheduled_calls
  ADD COLUMN IF NOT EXISTS google_meet_link text,
  ADD COLUMN IF NOT EXISTS google_event_id_sitter text,
  ADD COLUMN IF NOT EXISTS google_event_id_parent text,
  ADD COLUMN IF NOT EXISTS slot_start_at timestamptz,
  ADD COLUMN IF NOT EXISTS slot_end_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_scheduled_calls_slot_start
  ON public.scheduled_calls (sitter_id, slot_start_at);

-- 3. sitter_availability_slots: bucket + dedup
ALTER TABLE public.sitter_availability_slots
  ADD COLUMN IF NOT EXISTS bucket text
    CHECK (bucket IN ('morning', 'afternoon', 'evening'));

CREATE UNIQUE INDEX IF NOT EXISTS uniq_sitter_slot
  ON public.sitter_availability_slots (sitter_id, slot_start, slot_end);
