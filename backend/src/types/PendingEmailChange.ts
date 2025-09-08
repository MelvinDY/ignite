export interface PendingEmailChange {
  id: string;
  user_id: string;
  pending_email: string;
  otp_hash: string;
  otp_expires_at: string;
  otp_attempts: number;
  last_otp_sent_at: string;
  resend_count: number;
  locked_at?: string;
  created_at: string;
  updated_at: string;
}