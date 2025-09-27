-- RPC: count recent requests by sender (used by daily cap)
CREATE OR REPLACE FUNCTION public.count_recent_connection_requests(
  p_sender_id uuid,
  p_since timestamptz
) RETURNS bigint
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)::bigint
  FROM public.connection_requests
  WHERE sender_id = p_sender_id
    AND created_at >= p_since;
$$;

-- Helpful indexes for caps/cooldowns/lookups
-- 1) speed up daily-cap count(sender, created_at >= X)
CREATE INDEX IF NOT EXISTS ix_cr_sender_created_at
  ON public.connection_requests (sender_id, created_at DESC);

-- 2) speed up: latest decline between a pair (sender, receiver, status, acted_at desc)
CREATE INDEX IF NOT EXISTS ix_cr_pair_status_acted
  ON public.connection_requests (sender_id, receiver_id, status, acted_at DESC);

-- 3) speed up: “pending exists either direction”
CREATE INDEX IF NOT EXISTS ix_cr_status_sender_receiver
  ON public.connection_requests (status, sender_id, receiver_id);
