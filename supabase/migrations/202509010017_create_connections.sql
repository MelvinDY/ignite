-- Connections (undirected)
CREATE TABLE IF NOT EXISTS public.connections (
  user_id_a   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id_b   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  connected_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT connections_no_self CHECK (user_id_a <> user_id_b)
);

-- enforce one row per undirected pair
CREATE UNIQUE INDEX IF NOT EXISTS ux_connections_pair
ON public.connections ((LEAST(user_id_a, user_id_b)), (GREATEST(user_id_a, user_id_b)));

CREATE INDEX IF NOT EXISTS ix_connections_a ON public.connections(user_id_a);
CREATE INDEX IF NOT EXISTS ix_connections_b ON public.connections(user_id_b);
