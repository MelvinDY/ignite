-- Notification type enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE notification_type AS ENUM (
      'connection_request',
      'connection_accepted',
      'connection_declined',
      'connection_canceled',
      'connection_removed',
      'user_blocked',
      'user_unblocked'
    );
  END IF;
END $$;

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       notification_type NOT NULL,
  data       jsonb NOT NULL, -- { actor: { id, handle, photoUrl, headline }, requestId?, connectionWith? }
  read_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_notifications_user_unread
ON public.notifications(user_id, read_at, created_at DESC);
