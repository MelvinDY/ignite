export interface PendingEmailChange {
  id: string;
  owner_table: string;
  owner_id: string;
  purpose: string;
  pending_new_email: string;
  otp_hash: string;
  expires_at: string;
  attempts: number;
  resend_count: number;
  last_sent_at: string;
  locked_at: string | null;
  created_at: string;
  updated_at: string;
}