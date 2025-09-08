import nodemailer from "nodemailer";
import { supabase } from "../lib/supabase";
import { hashOtp } from "./otp.service";
import { PendingEmailChange } from "../types/PendingEmailChange";

const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, MAIL_FROM } =
  process.env;

let transporter: nodemailer.Transporter;

/**
 * Build transporter
 */
function buildTransport() {
  // if no SMTP host, fallback to console (so dev doesn’t crash)
  if (!SMTP_HOST) {
    return {
      sendMail: async (opts: any) => {
        console.log(
          "📧 [DEV console email]\nFrom:",
          opts.from,
          "\nTo:",
          opts.to,
          "\nSubject:",
          opts.subject,
          "\nHTML:\n",
          opts.html
        );
        return { messageId: "console-dev" };
      },
    } as any;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: String(SMTP_SECURE || "false") === "true",
    auth:
      SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
}

export async function sendEmail(to: string, subject: string, html: string) {
  if (!transporter) transporter = buildTransport();
  const from = MAIL_FROM || "Ignite <noreply@ignite.local>";
  const info = await transporter.sendMail({ from, to, subject, html });
  return info;
}

export async function createPendingEmailChange(
  userId: string,
  pendingEmail: string,
  otp: string
): Promise<void> {
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

  const { error } = await supabase.from("pending_email_changes").upsert(
    {
      user_id: userId,
      pending_email: pendingEmail.toLowerCase(),
      otp_hash: hashOtp(otp),
      otp_expires_at: expiresAt,
      otp_attempts: 0,
      last_otp_sent_at: now,
      resend_count: 0,
      locked_at: null,
      updated_at: now,
    },
    {
      onConflict: "user_id",
    }
  );

  if (error) throw error;
}

export async function getPendingEmailChange(
  userId: string
): Promise<PendingEmailChange | null> {
  const { data, error } = await supabase
    .from("pending_email_changes")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function completePendingEmailChange(
  userId: string
): Promise<string> {
  // Get the pending email
  const pending = await getPendingEmailChange(userId);
  if (!pending) throw new Error("No pending email change found");

  // Update user's email in profiles table
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      email: pending.pending_email,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (profileError) throw profileError;

  // Update user_signups table as well
  const { error: signupError } = await supabase
    .from("user_signups")
    .update({
      signup_email: pending.pending_email,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (signupError) throw signupError;

  // Clear pending change
  await clearPendingEmailChange(userId);

  return pending.pending_email;
}

export async function clearPendingEmailChange(userId: string): Promise<void> {
  const { error } = await supabase
    .from("pending_email_changes")
    .delete()
    .eq("user_id", userId);

  if (error) throw error;
}

export async function updateEmailChangeAttempts(
  userId: string,
  attempts: number,
  shouldLock: boolean = false
): Promise<void> {
  const updates: any = {
    otp_attempts: attempts,
    updated_at: new Date().toISOString(),
  };

  if (shouldLock) {
    updates.locked_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("pending_email_changes")
    .update(updates)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function resendEmailChangeOtp(
  userId: string,
  otp: string
): Promise<void> {
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { data: currentData, error: fetchError } = await supabase
    .from("pending_email_changes")
    .select("resend_count")
    .eq("user_id", userId)
    .single();

  if (fetchError) throw fetchError;

  const newResendCount = (currentData?.resend_count || 0) + 1;

  const { error } = await supabase
    .from("pending_email_changes")
    .update({
      otp_hash: hashOtp(otp),
      otp_expires_at: expiresAt,
      otp_attempts: 0,
      last_otp_sent_at: now,
      resend_count: newResendCount,
      locked_at: null,
      updated_at: now,
    })
    .eq("user_id", userId);

  if (error) throw error;
}
