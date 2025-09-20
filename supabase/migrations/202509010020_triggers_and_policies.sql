-- ============================================
-- Business logic triggers, helpers, and RLS
-- ============================================

-- Function to check blocks
CREATE OR REPLACE FUNCTION public.chk__no_block_between(u1 uuid, u2 uuid) RETURNS boolean AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.blocks b
     WHERE (b.blocker_id = u1 AND b.blocked_id = u2)
        OR (b.blocker_id = u2 AND b.blocked_id = u1)
  );
END $$ LANGUAGE plpgsql STABLE;

-- On block: sever connection + decline/cancel pending requests
CREATE OR REPLACE FUNCTION public.tg__on_block_cascade() RETURNS trigger AS $$
BEGIN
  DELETE FROM public.connections c
   WHERE (LEAST(c.user_id_a, c.user_id_b), GREATEST(c.user_id_a, c.user_id_b)) =
         (LEAST(NEW.blocker_id, NEW.blocked_id), GREATEST(NEW.blocker_id, NEW.blocked_id));

  UPDATE public.connection_requests cr
     SET status   = CASE WHEN cr.receiver_id = NEW.blocker_id THEN 'declined' ELSE 'canceled' END,
         acted_at = now(),
         updated_at = now()
   WHERE status = 'pending'
     AND ((cr.sender_id = NEW.blocker_id AND cr.receiver_id = NEW.blocked_id)
       OR (cr.sender_id = NEW.blocked_id AND cr.receiver_id = NEW.blocker_id));

  RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_blocks_cascade ON public.blocks;
CREATE TRIGGER tr_blocks_cascade
AFTER INSERT ON public.blocks
FOR EACH ROW EXECUTE FUNCTION public.tg__on_block_cascade();

-- Prevent requests if blocked or already connected
CREATE OR REPLACE FUNCTION public.tg__cr_prevent_if_blocked() RETURNS trigger AS $$
BEGIN
  IF NOT public.chk__no_block_between(NEW.sender_id, NEW.receiver_id) THEN
    RAISE EXCEPTION 'BLOCKED' USING ERRCODE = 'P0001';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.connections c
     WHERE (LEAST(c.user_id_a, c.user_id_b), GREATEST(c.user_id_a, c.user_id_b)) =
           (LEAST(NEW.sender_id, NEW.receiver_id), GREATEST(NEW.sender_id, NEW.receiver_id))
  ) THEN
    RAISE EXCEPTION 'ALREADY_CONNECTED' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_cr_prevent_if_blocked ON public.connection_requests;
CREATE TRIGGER tr_cr_prevent_if_blocked
BEFORE INSERT ON public.connection_requests
FOR EACH ROW EXECUTE FUNCTION public.tg__cr_prevent_if_blocked();

-- Simple relationship status view
CREATE OR REPLACE VIEW public.v_relationship_pairs AS
SELECT
  a.id AS me,
  b.id AS other,
  EXISTS (SELECT 1 FROM public.connections c
           WHERE (LEAST(c.user_id_a, c.user_id_b), GREATEST(c.user_id_a, c.user_id_b)) =
                 (LEAST(a.id, b.id), GREATEST(a.id, b.id))) AS connected,
  EXISTS (SELECT 1 FROM public.connection_requests r
           WHERE r.status = 'pending' AND r.sender_id = a.id AND r.receiver_id = b.id) AS pending_outgoing,
  EXISTS (SELECT 1 FROM public.connection_requests r
           WHERE r.status = 'pending' AND r.sender_id = b.id AND r.receiver_id = a.id) AS pending_incoming,
  EXISTS (SELECT 1 FROM public.blocks bl WHERE bl.blocker_id = a.id AND bl.blocked_id = b.id) AS blocked_by_me,
  EXISTS (SELECT 1 FROM public.blocks bl WHERE bl.blocker_id = b.id AND bl.blocked_id = a.id) AS blocked_me
FROM public.profiles a
CROSS JOIN public.profiles b
WHERE a.id <> b.id;

-- Enable RLS
ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications      ENABLE ROW LEVEL SECURITY;

-- Example policies (tune later)
CREATE POLICY "cr_select_own" ON public.connection_requests
  FOR SELECT USING (auth.uid() IN (sender_id, receiver_id));

CREATE POLICY "conn_select_own" ON public.connections
  FOR SELECT USING (auth.uid() IN (user_id_a, user_id_b));

CREATE POLICY "blocks_select_involving_me" ON public.blocks
  FOR SELECT USING (auth.uid() IN (blocker_id, blocked_id));

CREATE POLICY "notifs_select_mine" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
