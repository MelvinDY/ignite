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

  const { error: profileError } = await supabase.from("profiles").update({
    pending_new_email: pendingEmail.toLowerCase(),
    updated_at: now,
  });

  if (profileError) throw profileError;

  const { error: userOtpError } = await supabase.from("user_otps").upsert(
    {
      owner_table: "profiles",
      owner_id: userId,
      purpose: "EMAIL_CHANGE",
      otp_hash: hashOtp(otp),
      expires_at: expiresAt,
      attempts: 0,
      resend_count: 0,
      last_sent_at: now,
      locked_at: null,
      updated_at: now,
    },
    {
      onConflict: "owner_table,owner_id,purpose",
    }
  );

  if (userOtpError) throw userOtpError;
}

export async function getPendingEmailChange(
  userId: string
): Promise<PendingEmailChange | null> {
  const { data: otpData, error: otpError } = await supabase
    .from("user_otps")
    .select("*")
    .eq("owner_table", "profiles")
    .eq("owner_id", userId)
    .eq("purpose", "EMAIL_CHANGE")
    .maybeSingle();

  if (otpError) throw otpError;

  if (!otpData) return null;

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("pending_new_email")
    .eq("id", userId)
    .single();

  if (profileError) throw profileError;
  console.log('From service:')
  console.log(otpData)
  return {
    ...otpData,
    pending_new_email: profileData.pending_new_email,
    user_id: userId,
    expires_at: otpData.expires_at,
    attempts: otpData.attempts,
  };
}

export async function completePendingEmailChange(
  userId: string
): Promise<string> {
  // Get the pending email
  const pending = await getPendingEmailChange(userId);
  if (!pending) throw new Error("No pending email change found");

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      email: pending.pending_new_email,
      pending_new_email: null, // Clear the pending email
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (profileError) throw profileError;

  // Update user_signups table as well
  const { error: signupError } = await supabase
    .from("user_signups")
    .update({
      signup_email: pending.pending_new_email,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (signupError) throw signupError;

  // Clear the OTP record
  await clearPendingEmailChange(userId);

  return pending.pending_new_email;
}

export async function clearPendingEmailChange(userId: string): Promise<void> {
  const { error: otpError } = await supabase
    .from("user_otps")
    .delete()
    .eq("owner_table", "profiles")
    .eq("owner_id", userId)
    .eq("purpose", "EMAIL_CHANGE");

  if (otpError) throw otpError;

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      pending_new_email: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (profileError) throw profileError;
}

export async function updateEmailChangeAttempts(
  userId: string,
  attempts: number,
  shouldLock: boolean = false
): Promise<void> {
  const updates: any = {
    attempts: attempts,
    updated_at: new Date().toISOString(),
  };

  if (shouldLock) {
    updates.locked_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("user_otps")
    .update(updates)
    .eq("owner_id", userId);

  if (error) throw error;
}

export async function resendEmailChangeOtp(
  userId: string,
  otp: string
): Promise<void> {
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { data: currentData, error: fetchError } = await supabase
    .from("user_otps")
    .select("resend_count")
    .eq("owner_id", userId)
    .single();

  if (fetchError) throw fetchError;

  const newResendCount = (currentData?.resend_count || 0) + 1;

  const { error } = await supabase
    .from("user_otps")
    .update({
      otp_hash: hashOtp(otp),
      expires_at: expiresAt,
      attempts: 0,
      last_sent_at: now,
      resend_count: newResendCount,
      locked_at: null,
      updated_at: now,
    })
    .eq("owner_id", userId);

  if (error) throw error;
}
