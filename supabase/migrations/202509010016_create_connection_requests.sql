-- Connection Requests table & status enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'connection_request_status') THEN
    CREATE TYPE connection_request_status AS ENUM ('pending','accepted','declined','canceled');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.connection_requests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status      connection_request_status NOT NULL DEFAULT 'pending',
  message     text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  acted_at    timestamptz,
  CONSTRAINT connection_requests_no_self CHECK (sender_id <> receiver_id)
);

-- touch updated_at
CREATE OR REPLACE FUNCTION public.tg__touch_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_touch_cr ON public.connection_requests;
CREATE TRIGGER tr_touch_cr
BEFORE UPDATE ON public.connection_requests
FOR EACH ROW EXECUTE FUNCTION public.tg__touch_updated_at();

-- Unique pending pair (one request either direction at a time)
CREATE UNIQUE INDEX IF NOT EXISTS ux_cr_pending_pair
ON public.connection_requests ((LEAST(sender_id, receiver_id)), (GREATEST(sender_id, receiver_id)))
WHERE status = 'pending';
