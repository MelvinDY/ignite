// src/routes/auth.routes.ts

import { Router } from "express";
import { compare as bcryptCompare } from "bcryptjs";
import { supabase } from "../lib/supabase";
import {
  ChangeEmailPreVerifySchema,
  ChangeEmailRequestSchema,
  RegisterSchema,
  VerifyEmailChangeSchema,
  VerifyOtpSchema,
  loginSchema,
  RequestPasswordResetSchema,
  VerifyPasswordResetOtpSchema,
  ResetPasswordSchema
} from "../validation/auth.schemas";
import { hashPassword } from "../utils/crypto";
import {
  hashResumeToken,
  makeResumeToken,
  resumeExpiryISO,
  verifyResumeToken,
  invalidateResumeToken,
  generateAccessToken,
  generateRefreshToken,
  verifyResumeTokenStrict,
  rotateResumeToken,
  invalidateRefreshToken,
  verifyTokenVersion,
  makeResetSessionToken,
  verifyResetSessionToken
} from "../utils/tokens";
import { maskEmail } from "../utils/email";
import { rateLimit } from "../middlewares/rateLimit";
import {
  loadPendingSignup,
  hashOtp,
  activateUser,
  bumpAttemptsOrLock,
  deleteSignupOtp,
  getSignupOtp,
  issueSignupOtp,
  generateOtp,
  getResetPasswordOtp,
} from "../services/otp.service";
import { applyProgramAndMajorFromSignupToProfile, ensureProfileForSignup } from "../services/profile.service";
import * as jwt from "jsonwebtoken";
import * as crypto from "crypto";
import {
  completePendingEmailChange,
  createPendingEmailChange,
  getPendingEmailChange,
  updateEmailChangeAttempts,
  resendEmailChangeOtp,
  clearPendingEmailChange,
} from "../services/email.service";
import { processResetOtpRequest, processCancelResetOtp } from "../services/passwordReset.service";

const router = Router();

// 10 requests / hour per (IP+email)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => {
    const emailLower = (req.body?.email || "").toLowerCase();
    // If body is empty/malformed, still bucket by IP so it doesn’t bypass
    return `${req.ip}:${emailLower}`;
  },
});

// 10 attempts / 10 min per (IP+resumeToken)
const verifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => `${req.ip}:${req.body?.resumeToken || ""}`,
});

/**
 * User Stories 1.1: User Registration
 */
router.post("/auth/register", registerLimiter, async (req, res) => {
  // 1) validate
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ code: "VALIDATION_ERROR", details: parsed.error.flatten() });
  }

  const {
    fullName,
    zid,
    level,
    yearIntake,
    isIndonesian,
    program,
    major,
    email,
    password,
  } = parsed.data;
  const emailLower = email.toLowerCase();

  try {
    // 2) reject if email already belongs to an ACTIVE user in profiles
    const { data: byEmailActive } = await supabase
      .from("profiles")
      .select("id")
      .eq("status", "ACTIVE")
      .eq("email", emailLower) // emails stored in lowercase
      .maybeSingle();
    if (byEmailActive) return res.status(409).json({ code: "EMAIL_EXISTS" });

    // 3) zID already ACTIVE? (profiles = ACTIVE only)
    const { data: activeByZid } = await supabase
      .from("profiles")
      .select("id")
      .eq("status", "ACTIVE")
      .eq("zid", zid)
      .maybeSingle();
    if (activeByZid) return res.status(409).json({ code: "ZID_EXISTS" });

    // 4) pending exists (email or zid) in user_signups
    const { data: pendingByEmail } = await supabase
      .from("user_signups")
      .select("id, zid")
      .eq("signup_email", emailLower)
      .eq("status", "PENDING_VERIFICATION")
      .maybeSingle();

    if (pendingByEmail) {
      // If email is already bound to a different zID, block with ZID_MISMATCH
      if (pendingByEmail.zid !== zid) {
        return res.status(409).json({ code: "ZID_MISMATCH" });
      }
      // Same person resuming signup
      const resumeToken = await rotateResumeToken(pendingByEmail.id);
      return res
        .status(409)
        .json({ code: "PENDING_VERIFICATION_EXISTS", resumeToken });
    }

    // No pending-by-email → try pending-by-zid (normal resume path)
    const { data: pendingByZid } = await supabase
      .from("user_signups")
      .select("id")
      .eq("zid", zid)
      .eq("status", "PENDING_VERIFICATION")
      .maybeSingle();

    if (pendingByZid) {
      const resumeToken = await rotateResumeToken(pendingByZid.id);
      return res
        .status(409)
        .json({ code: "PENDING_VERIFICATION_EXISTS", resumeToken });
    }

    // 5) revival: EXPIRED by zID (zID is the true identifier)
    const { data: expiredByZid } = await supabase
      .from("user_signups")
      .select("id, signup_email")
      .eq("zid", zid)
      .eq("status", "EXPIRED")
      .maybeSingle();

    if (expiredByZid) {
      const { data: revived, error: reviveErr } = await supabase
        .from("user_signups")
        .update({
          signup_email: emailLower,
          full_name: fullName,
          level,
          year_intake: yearIntake,
          is_indonesian: isIndonesian,
          program,
          major,
          password_hash: await hashPassword(password),
          status: "PENDING_VERIFICATION",
          email_verified_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", expiredByZid.id)
        .select("id")
        .single();
      if (reviveErr) throw reviveErr;

      await issueSignupOtp(revived.id, emailLower, fullName);
      const resumeToken = await rotateResumeToken(revived.id);
      console.info("registration.created", { userId: revived.id });
      return res
        .status(201)
        .json({ success: true, userId: revived.id, resumeToken });
    }

    // 5b) Guard: EXPIRED row with same email but different zID
    const { data: expiredByEmail } = await supabase
      .from("user_signups")
      .select("id, zid")
      .eq("signup_email", emailLower)
      .eq("status", "EXPIRED")
      .maybeSingle();
    if (expiredByEmail && expiredByEmail.zid !== zid) {
      return res.status(409).json({ code: "ZID_MISMATCH" });
    }

    // 6) fresh PENDING row in user_signups
    const { data: created, error: insertErr } = await supabase
      .from("user_signups")
      .insert({
        signup_email: emailLower,
        full_name: fullName,
        zid,
        level,
        year_intake: yearIntake,
        is_indonesian: isIndonesian,
        program,
        major,
        password_hash: await hashPassword(password),
        status: "PENDING_VERIFICATION",
        email_verified_at: null,
      })
      .select("id")
      .single();
    if (insertErr) throw insertErr;

    // sending otp
    await issueSignupOtp(created.id, emailLower, fullName);

    const resumeToken = makeResumeToken(created.id);
    await supabase
      .from("user_signups")
      .update({
        resume_token_hash: hashResumeToken(resumeToken),
        resume_token_expires_at: resumeExpiryISO(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", created.id);

    // logging
    console.info("registration.created", { userId: created.id });

    return res.status(201).json({
      success: true,
      userId: created.id,
      resumeToken: resumeToken,
    });
  } catch (err: any) {
    console.error("register.error", err?.message || err);
    return res.status(500).json({ code: "INTERNAL" });
  }
});

/**
 * User Story 1.2: Verify OTP (Activate account)
 */
router.post("/auth/verify-otp", verifyLimiter, async (req, res) => {
  const parsed = VerifyOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ code: "VALIDATION_ERROR", details: parsed.error.flatten() });
  }

  const { resumeToken, otp } = parsed.data;

  try {
    // 1) Verify resumeToken signature/claims (JWT) and extract userId
    let userId: string;
    try {
      ({ userId } = await verifyResumeTokenStrict(resumeToken));
    } catch {
      return res.status(401).json({ code: "RESUME_TOKEN_INVALID" });
    }

    // 2) Load pending signup (status gate)
    const { data: row, error } = await loadPendingSignup(userId);
    if (error || !row)
      return res.status(404).json({ code: "PENDING_NOT_FOUND" });
    if (row.status === "ACTIVE")
      return res.status(409).json({ code: "ALREADY_VERIFIED" });
    if (row.status !== "PENDING_VERIFICATION")
      return res.status(404).json({ code: "PENDING_NOT_FOUND" });

    // 3) Load OTP from user_otps
    const { data: otpRow } = await getSignupOtp(userId);
    if (!otpRow) return res.status(404).json({ code: "PENDING_NOT_FOUND" });
    if (otpRow.locked_at) return res.status(423).json({ code: "OTP_LOCKED" });

    // 4) Expiry
    if (!otpRow.expires_at || new Date(otpRow.expires_at) < new Date()) {
      await bumpAttemptsOrLock(otpRow.id, otpRow.attempts ?? 0);
      return res.status(400).json({ code: "OTP_EXPIRED" });
    }

    // 5) Compare hashes
    const ok = otpRow.otp_hash && hashOtp(otp) === otpRow.otp_hash;
    if (!ok) {
      const after = await bumpAttemptsOrLock(otpRow.id, otpRow.attempts ?? 0);
      if (after >= 5) return res.status(423).json({ code: "OTP_LOCKED" });
      return res.status(400).json({ code: "OTP_INVALID" });
    }

    // 6) Success → activate, delete OTP, invalidate resume token
    const profileId = await ensureProfileForSignup(userId);

    await applyProgramAndMajorFromSignupToProfile(userId, profileId);
    await activateUser(userId);
    await deleteSignupOtp(userId);
    await invalidateResumeToken(userId);

    console.info("registration.verified", { userId });
    return res
      .status(200)
      .json({ success: true, message: "Account verified successfully" });
  } catch (err: any) {
    console.error("verify-otp.error", err?.message || err);
    return res.status(500).json({ code: "INTERNAL" });
  }
});

const resendLimiter = rateLimit({
  windowMs: 60 * 1000, // soft outer throttle
  max: 3,
  keyGenerator: (req) => `${req.ip}:${req.body?.resumeToken || ""}`,
});

router.post("/auth/resend-otp", resendLimiter, async (req, res) => {
  const { resumeToken } = req.body || {};
  if (!resumeToken) return res.status(400).json({ code: "VALIDATION_ERROR" });

  try {
    let userId: string;
    try {
      ({ userId } = await verifyResumeTokenStrict(resumeToken));
    } catch {
      return res.status(401).json({ code: "RESUME_TOKEN_INVALID" });
    }

    // must be pending
    const { data: row } = await loadPendingSignup(userId);
    if (!row) return res.status(404).json({ code: "PENDING_NOT_FOUND" });
    if (row.status === "ACTIVE")
      return res.status(409).json({ code: "ALREADY_VERIFIED" });
    if (row.status !== "PENDING_VERIFICATION")
      return res.status(404).json({ code: "PENDING_NOT_FOUND" });

    // get current OTP row for cooldown + cap
    const { data: otpRow } = await getSignupOtp(userId);
    const now = new Date();
    const COOLDOWN_MS = 60 * 1000;
    const DAILY_CAP = 5;

    if (otpRow?.last_sent_at) {
      const last = new Date(otpRow.last_sent_at).getTime();
      if (now.getTime() - last < COOLDOWN_MS) {
        return res.status(429).json({ code: "OTP_COOLDOWN" });
      }
      if ((otpRow.resend_count ?? 0) >= DAILY_CAP) {
        return res.status(429).json({ code: "OTP_RESEND_LIMIT" });
      }
    }

    // fetch email+name for sending
    type SignupRow = { signup_email: string; full_name: string };

    const { data: signup, error: sErr } = await supabase
      .from("user_signups")
      .select("signup_email, full_name")
      .eq("id", userId)
      .maybeSingle<SignupRow>(); // <- maybeSingle so TS knows null is possible

    if (sErr) {
      console.error("resend-otp.lookup.error", sErr);
      return res.status(500).json({ code: "INTERNAL" });
    }
    if (!signup) {
      return res.status(404).json({ code: "PENDING_NOT_FOUND" });
    }

    // issue fresh code (overwrites row; resets attempts)
    await issueSignupOtp(userId, signup.signup_email, signup.full_name);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("resend-otp.error", err);
    return res.status(500).json({ code: "INTERNAL" });
  }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 failed attempts per window
  keyGenerator: (req) => `${req.ip}:${(req.body?.email || "").toLowerCase()}`,
});

/**
 * User Story 1.8: User Login
 */
router.post("/auth/login", loginLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ code: "VALIDATION_ERROR", details: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;
  const emailLower = email.toLowerCase();

  try {
    console.info("login.attempt", { email: emailLower, ip: req.ip });
    // 1. Find signup row
    const { data: row } = await supabase
      .from("user_signups")
      .select("id, status, password_hash, profile_id, zid")
      .eq("signup_email", emailLower)
      .maybeSingle();

    if (!row) {
      console.warn("login.no_user", { email: emailLower });
      return res.status(401).json({ code: "INVALID_CREDENTIALS" });
    }

    if (row.status === "PENDING_VERIFICATION" || row.status === "EXPIRED") {
      console.warn("login.not_active", { userId: row.id, status: row.status });
      return res.status(403).json({ code: "ACCOUNT_NOT_VERIFIED" });
    }

    const hashed =
      ((row as any)?.password_hash as string | undefined) ||
      ((row as any)?.user?.encrypted_password as string | undefined);
    const hashSource = (row as any)?.password_hash
      ? "user_signups.password_hash"
      : (row as any)?.user?.encrypted_password
        ? "auth.users.encrypted_password"
        : "none";
    console.info("login.hash_source", {
      userId: row.id,
      source: hashSource,
      hasHash: Boolean(hashed),
    });
    const ok = hashed ? await bcryptCompare(password, hashed) : false;
    if (!ok) {
      console.warn("login.bad_password", { userId: row.id });
      return res.status(401).json({ code: "INVALID_CREDENTIALS" });
    }

    // 2. Find profile row (canonical user id)
    let profileId = row.profile_id;
    if (!profileId) {
      // fallback: lookup by signup zID (should not happen if ensureProfileForSignup is used)
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("zid", row.zid)
        .maybeSingle();
      profileId = profile?.id;
    }
    if (!profileId) {
      console.error("login.no_profile", { signupId: row.id });
      return res.status(500).json({ code: "INTERNAL", details: "No profile found for user" });
    }

    const accessToken = await generateAccessToken(profileId);
    const refreshToken = await generateRefreshToken(profileId);

    // Set refresh token cookie (HttpOnly, Secure, SameSite=Lax)
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    console.info("login.success", { userId: profileId });
    return res.status(200).json({
      success: true,
      userId: profileId,
      accessToken,
      expiresIn: 60 * 15,
    });
  } catch (err: any) {
    console.error("login.error", err?.message || err);
    return res.status(500).json({ code: "INTERNAL" });
  }
});

/**
 * Token refresh: issues new access token using HttpOnly refresh cookie
 */
router.post("/auth/refresh", async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken as string | undefined;
    if (!refreshToken)
      return res.status(401).json({ code: "INVALID_CREDENTIALS" });

    let payload: any;
    try {
      // If this is not working, possible issues:
      // 1. process.env.JWT_SECRET is undefined or not set correctly.
      // 2. The refreshToken is malformed or not a valid JWT.
      // 3. The jwt.verify function is not being called correctly (e.g., wrong import).
      // 4. The code is being run in a test environment where jwt.verify is mocked or behaves differently.
      // For debugging, log the secret and token (do not do this in production!):
      console.log("JWT_SECRET:", process.env.JWT_SECRET);
      console.log("refreshToken:", refreshToken);
      payload = jwt.verify(refreshToken, process.env.JWT_SECRET!);
    } catch (err) {
      console.error("decode error:", err);
      return res.status(401).json({ code: "INVALID_CREDENTIALS" });
    }

    const userId = payload?.sub as string | undefined;
    const tokenVersion = payload?.tokenVersion as number | undefined;
    console.log("userId", userId);
    console.log("tokenVersion", tokenVersion);
    if (!userId || !tokenVersion)
      return res.status(401).json({ code: "INVALID_CREDENTIALS" });

    // Verify token version is still valid
    const isTokenValid = await verifyTokenVersion(userId, tokenVersion);
    if (!isTokenValid) {
      return res.status(401).json({ code: "INVALID_CREDENTIALS" });
    }

    const accessToken = await generateAccessToken(userId);
    return res
      .status(200)
      .json({ success: true, accessToken, expiresIn: 60 * 15 });
  } catch (err: any) {
    console.error("refresh.error", err?.message || err);
    return res.status(500).json({ code: "INTERNAL" });
  }
});

/**
 * User Story: User Logout
 */
router.post("/auth/logout", async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken as string | undefined;

    // If no refresh token, return 401
    if (!refreshToken) {
      return res.status(401).json({ code: "NOT_AUTHENTICATED" });
    }

    // Verify the refresh token to get userId
    let payload: any;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_SECRET!);
    } catch {
      return res.status(401).json({ code: "NOT_AUTHENTICATED" });
    }

    const userId = payload?.sub as string | undefined;
    const tokenVersion = payload?.tokenVersion as number | undefined;

    if (!userId || !tokenVersion) {
      return res.status(401).json({ code: "NOT_AUTHENTICATED" });
    }

    // Verify token version is still valid (not already invalidated)
    const isTokenValid = await verifyTokenVersion(userId, tokenVersion);
    if (!isTokenValid) {
      // Token already invalidated, but we still clear the cookie and return success (idempotent)
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });
      return res.status(200).json({ success: true });
    }

    // Invalidate the refresh token by incrementing token version
    await invalidateRefreshToken(userId);

    // Clear the refresh token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    console.info("logout.success", { userId });
    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("logout.error", err?.message || err);
    return res.status(500).json({ code: "INTERNAL" });
  }
});

/**
 * User Stories 1.4: Change Email (Pre-Verification)
 */
router.patch("/auth/pending/email", async (req, res) => {
  // 1. Validate input
  const parsed = ChangeEmailPreVerifySchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ code: "VALIDATION_ERROR", details: parsed.error.flatten() });
  }
  const { resumeToken, newEmail } = parsed.data;
  const newEmailLower = newEmail.toLowerCase();

  try {
    // 2. Verify resumeToken and extract userId
    let userId: string;
    try {
      ({ userId } = verifyResumeToken(resumeToken));
    } catch {
      return res.status(401).json({ code: "RESUME_TOKEN_INVALID" });
    }
    // 3. Ensures newEmail is not used by an active user
    const { data: byEmailActive, error: emailErr } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", newEmailLower)
      .maybeSingle();

    if (emailErr) {
      console.error("change-email-pre-verify.email_check.error", emailErr);
    }
    if (byEmailActive) {
      return res.status(409).json({ code: "EMAIL_EXISTS" });
    }
    // 4. Load pending signup & status of user is PENDING_VERIFICATION
    const { data: userSignup, error: signupErr } = await supabase
      .from("user_signups")
      .select("id, status, full_name")
      .eq("id", userId)
      .maybeSingle();

    // User not found
    if (signupErr || !userSignup) {
      return res.status(404).json({ code: "PENDING_NOT_FOUND" });
    }
    // Rejects active user
    if (userSignup.status === "ACTIVE") {
      return res.status(409).json({ code: "ALREADY_VERIFIED" });
    }
    // Rejects expired user
    if (userSignup.status === "EXPIRED") {
      return res.status(404).json({ code: "PENDING_NOT_FOUND" });
    }
    // 5. Update user email
    await supabase
      .from("user_signups")
      .update({
        signup_email: newEmailLower,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
    // 6. Invalidate all prior OTP + resumeToken
    await invalidateResumeToken(userId);
    await deleteSignupOtp(userId);
    // 7. Rotate a new resumeToken for new email
    const newResumeToken = makeResumeToken(userId);
    await supabase
      .from("user_signups")
      .update({
        resume_token_hash: hashResumeToken(newResumeToken),
        resume_token_expires_at: resumeExpiryISO(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
    // 8. Generate & send new OTP
    await issueSignupOtp(userId, newEmailLower, userSignup.full_name);

    console.info("change-email-pre-verify.success", {
      userId,
      newEmail: newEmailLower,
    });
    return res.status(200).json({
      success: true,
      resumeToken: newResumeToken,
    });
   } catch (err: any) {
    console.error('change-email-pre-verify.error', err?.message || err);
    return res.status(500).json({ code: 'INTERNAL' });
   }
});

/**
 * User Story 1.5: Get pending registration context
 */
router.get('/auth/pending/context', async (req, res) => {
  const resumeToken = req.query.resumeToken as string;

  try {
    // 1. Validate resumeToken, get user id
    let userId: string;
    try {
      ({ userId } = await verifyResumeTokenStrict(resumeToken));
    } catch {
      return res.status(401).json({ code: 'RESUME_TOKEN_INVALID' });
    }

    // 2. Get sign up data from id
    const { data: userSignup, error: signupErr } = await supabase
      .from('user_signups')
      .select('id, signup_email, status')
      .eq('id', userId)
      .maybeSingle();

    const { data: userOtp } = await supabase
      .from('user_otps')
      .select('last_sent_at, resend_count')
      .eq('owner_id', userId)
      .maybeSingle();

    if (!userSignup || signupErr) {
      return res.status(404).json({ code: 'PENDING_NOT_FOUND' });
    }

    // 3. Ensures status = PENDING_VERIFICATION
    if (userSignup.status === 'ACTIVE') {
      return res.status(409).json({ code: 'ALREADY_VERIFIED' });
    }

    if (userSignup.status === 'EXPIRED') {
      return res.status(404).json({ code: 'PENDING_NOT_FOUND' });
    }

    // 4. Calculate resend states
    const now = new Date();
    let cooldownSeconds = 0;
    let remainingToday = 5;

    if (userOtp?.last_sent_at) {
      const lastSentAt = new Date(userOtp.last_sent_at);
      // Calculates time since last sent OTP in seconds
      const timeSinceLastSent = Math.floor((now.getTime() - lastSentAt.getTime()) / 1000);
      cooldownSeconds = Math.max(0, 60 - timeSinceLastSent);
    }

    if (userOtp?.resend_count !== undefined) {
      // Calculates the remaining OTP attempts for today (5 OTP attempts a day)
      remainingToday = Math.max(5 - userOtp.resend_count, 0);
    }
    // 5. Mask email for privacy
    const emailMasked = maskEmail(userSignup.signup_email);
    // 6. Return the context
    return res.status(200).json({
      emailMasked,
      status: userSignup.status,
      resend: {
        cooldownSeconds,
        remainingToday
      }
    });
  } catch (err: any) {
    console.error('pending-context.error', err?.message || err);
    return res.status(500).json({ code: 'INTERNAL' });
  }     
});

/**
 * User Story 1.10: Change Email (Start)
 */
router.post("/user/email/change-request", async (req, res) => {
  const parsed = ChangeEmailRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res
      .status(400)
      .json({ code: "VALIDATION_ERROR", details: parsed.error.issues });
  }

  const { newEmail, currentPassword } = parsed.data;
  const newEmailLowered = newEmail.toLowerCase();

  const accessToken = req.headers.authorization?.split(" ")[1];

  if (!accessToken) {
    return res
      .status(401)
      .json({ code: "NOT_AUTHENTICATED", details: "Invalid or expired token" });
  }

  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET!) as any;
    const profileId = decoded.sub;

    const { data: userRow } = await supabase
      .from("user_signups")
      .select("password_hash, full_name")
      .eq("profile_id", profileId)
      .single();

    if (!userRow) {
      return res
        .status(404)
        .json({ code: "USER_NOT_FOUND", details: "User not found" });
    }

    const checkPassword = await bcryptCompare(
      currentPassword,
      userRow.password_hash
    );

    if (!checkPassword) {
      return res
        .status(400)
        .json({ code: "VALIDATION_ERROR", details: "Incorrect password" });
    }

    // Check if they are existing emails on BOTH active OR pending emails
    const [{ data: emailExists }, { data: pendingExists }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id")
        .eq("email", newEmailLowered)
        .eq("status", "ACTIVE")
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("id")
        .eq("pending_new_email", newEmailLowered)
        .eq("status", "ACTIVE")
        .maybeSingle()
    ]);

    const existingUser = emailExists || pendingExists;

    if (existingUser) {
      return res
        .status(409)
        .json({ code: "EMAIL_EXISTS", details: "Given email is already used" });
    }

    const otp = generateOtp();
    await createPendingEmailChange(profileId, newEmailLowered, otp);

    if (!userRow.full_name) {
      return res
        .status(404)
        .json({ code: "USER_NOT_FOUND", details: "User has no full name" });
    }

    await issueSignupOtp(profileId, newEmailLowered, userRow.full_name);
    const emailParts = newEmailLowered.split("@");
    const localPart = emailParts[0];
    const domain = emailParts[1];
    const maskedLocal =
      localPart[0] +
      "*".repeat(Math.max(0, localPart.length - 2)) +
      localPart.slice(-1);
    const maskedDomain =
      domain[0] + "*".repeat(Math.max(0, domain.length - 4)) + domain.slice(-3);
    const emailMasked = `${maskedLocal}@${maskedDomain}`;

    console.info("email-change.requested", {
      profileId,
      newEmail: newEmailLowered,
    });

    return res.status(200).json({
      success: true,
      emailMasked,
      expiresInSeconds: 600,
    });
  } catch (err: any) {
    console.error("email-change-request.error", err?.message || err);
    return res.status(500).json({ code: "INTERNAL" });
  }
});

/**
 * User Story 1.11: Verify email change (Complete)
 */
router.post("/user/email/verify-change", async (req, res) => {
  const parsed = VerifyEmailChangeSchema.safeParse(req.body);

  if (!parsed.success) {
    return res
      .status(400)
      .json({ code: "VALIDATION_ERROR", details: parsed.error.issues });
  }

  const { otp } = parsed.data;

  const accessToken = req.headers.authorization?.split(" ")[1];

  if (!accessToken) {
    return res
      .status(401)
      .json({ code: "NOT_AUTHENTICATED", details: "Invalid or expired token" });
  }

  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET!) as any;
    const userId = decoded.sub;

    const pendingChange = await getPendingEmailChange(userId);
    console.log('pendingChange:', pendingChange);
    if (!pendingChange) {
      return res.status(404).json({ code: "NO_PENDING_EMAIL_CHANGE" });
    }

    if (pendingChange.locked_at) {
      return res.status(423).json({ code: "OTP_LOCKED" });
    }

    if (new Date(pendingChange.expires_at) < new Date()) {
      return res.status(400).json({ code: "OTP_EXPIRED" });
    }

    if (!(hashOtp(otp) === pendingChange.otp_hash)) {
      const newAttempts = pendingChange.attempts + 1;

      await updateEmailChangeAttempts(userId, newAttempts, newAttempts >= 5);

      if (newAttempts >= 5) {
        return res.status(423).json({ code: "OTP_LOCKED" });
      }

      return res.status(400).json({ code: "OTP_INVALID" });
    }

    const newEmail = await completePendingEmailChange(userId);
    await invalidateRefreshToken(userId);

    const newAccessToken = await generateAccessToken(userId);
    const newRefreshToken = await generateRefreshToken(userId);

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    console.info("email-change.completed", { userId, newEmail });
    return res.status(200).json({
      success: true,
      message: "Email updated successfully",
      newAccessToken,
    });
  } catch (err: any) {
    console.error("verify-email-change.error", err?.message || err);
    return res.status(500).json({ code: "INTERNAL" });
  }
});

const emailChangeResendLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 1 day
  max: 5,
  keyGenerator: (req) => {
    const emailLower = (req.body?.email || "").toLowerCase();
    return `${req.ip}:${emailLower}`;
  },
});

/**
 * User Stories 1.12: Resend OTP (Email Change)
 */
router.post(
  "/user/email/resend-otp",
  emailChangeResendLimiter,
  async (require, res) => {
    const accessToken = require.headers.authorization?.split(" ")[1];

    if (!accessToken) {
      return res
        .status(401)
        .json({
          code: "NOT_AUTHENTICATED",
          details: "Invalid or expired token",
        });
    }

    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET!) as any;
    const userId = decoded.sub;

    try {
      const pendingChange = await getPendingEmailChange(userId);

      if (!pendingChange) {
        return res.status(404).json({ code: "NO_PENDING_EMAIL_CHANGE" });
      }

      const lastSent = new Date(pendingChange.last_sent_at).getTime();
      const now = Date.now();
      const cooldownMs = 60 * 1000;

      if (now - lastSent < cooldownMs) {
        return res.status(429).json({ code: "OTP_COOLDOWN" });
      }

      if (pendingChange.resend_count >= 5) {
        return res.status(429).json({ code: "OTP_RESEND_LIMIT" });
      }

      const otp = generateOtp();
      await resendEmailChangeOtp(userId, otp);

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .single();

      await issueSignupOtp(
        pendingChange.pending_new_email,
        profile?.full_name || "User",
        otp
      );

      console.info("email-change.otp-resent", { userId });
      return res.status(200).json({
        success: true,
        expiresInSeconds: 600,
      });
    } catch (err: any) {
      console.error("resend-email-change-otp.error", err?.message || err);
      return res.status(500).json({ code: "INTERNAL" });
    }
  }
);

/**
 * User Stories 1.13: Cancel Email Change
 */
router.delete("/user/email/cancel-change", async (req, res) => {
  const accessToken = req.headers.authorization?.split(" ")[1];

  if (!accessToken) {
    return res.status(401).json({ code: "NOT_AUTHENTICATED" });
  }

  const decoded = jwt.verify(accessToken, process.env.JWT_SECRET!) as any;
  const userId = decoded.sub;

  try {
    // Clear instance in user_otps table
    await clearPendingEmailChange(userId);
    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("resend-email-change-otp.error", err?.message || err);
    return res.status(500).json({ code: "INTERNAL" });
  }
});

// request reset password limiter to reduce spam (still returns 200 on pass/fail)
// (5 attempts / 10 min per IP+email)
const requestResetLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => `${req.ip}:${(req.body?.email || '').toLowerCase()}`,
});

/**
 * User Stories 1.14: Request Password Reset (Start)
 */
router.post('/auth/password/request-reset', requestResetLimiter, async (req, res) => {
  // 1) validate email
  const parsed = RequestPasswordResetSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', details: parsed.error.issues });
  }

  const emailLower = parsed.data.email.toLowerCase();
  const result = await processResetOtpRequest(
    emailLower,
    'If this email exists, a code has been sent.',
    'password-reset.request'
  );

  return res.status(200).json(result);
});

/**
 * Story 1.15 – Verify Password Reset OTP (Create reset session)
 */
router.post('/auth/password/verify-otp', async (req, res) => {
  // 1. Validate email and otp
  const parsed = VerifyPasswordResetOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', details: parsed.error.issues });
  }

  const { email, otp } = parsed.data;
  const emailLower = email.toLowerCase();

  try {
    // 2. Find profile by email
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('id, status')
      .eq('email', emailLower)
      .maybeSingle();

    if (profileErr || !profile || profile.status !== 'ACTIVE') {
      return res.status(400).json({ code: 'OTP_INVALID' });
    }

    const profileId = profile.id;

    // 3. Get existing RESET_PASSWORD OTP row
    const { data: otpRow, error: otpErr } = await getResetPasswordOtp(profileId);
    if (otpErr || !otpRow) {
      return res.status(400).json({ code: 'OTP_INVALID' });
    }

    // 4. Check locked
    if (otpRow.locked_at) {
      return res.status(423).json({ code: 'OTP_LOCKED' });
    }

    const now = new Date();

    // 5. Check expiry
    if (new Date(otpRow.expires_at).getTime() < now.getTime()) {
      return res.status(400).json({ code: 'OTP_EXPIRED' });
    }

    // 6. Verify OTP
    const hashedInput = hashOtp(otp);
    const presented = Buffer.from(hashedInput, 'hex');
    const stored = Buffer.from(otpRow.otp_hash, 'hex');
    const isMatch =
      presented.length === stored.length &&
      crypto.timingSafeEqual(presented, stored);

    // Increment OTP attempts (lock at 5 attempts)
    if (!isMatch) {
      const newAttempts = (otpRow.attempts ?? 0) + 1;
      const updates: any = { attempts: newAttempts, updated_at: now.toISOString() };
      if (newAttempts >= 5) {
        updates.locked_at = now.toISOString();
      }
      await supabase.from('user_otps').update(updates).eq('id', otpRow.id);
      return res.status(400).json({ code: 'OTP_INVALID' });
    }

    // 7. Success, issue resetSessionToken
    const { token, expiresIn } = makeResetSessionToken(profileId);

    // Clear OTP row
    await supabase
      .from('user_otps')
      .delete()
      .eq('id', otpRow.id);

    console.info('password-reset.verify.success', { profileId });

    return res.status(200).json({
      success: true,
      resetSessionToken: token,
      expiresIn,
    });
  } catch (err: any) {
    console.error('password-reset.verify.error', err?.message || err);
    return res.status(500).json({ code: 'INTERNAL' });
  }
});

/**
 * Story 1.16 – Set New Password (Complete)
 */
router.post('/auth/password/reset', async (req, res) => {
  // 1) Validate input shape & password policy
  const parsed = ResetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', details: parsed.error.issues });
  }

  const { resetSessionToken, newPassword } = parsed.data;

  try {
    // 2) Verify resetSessionToken (JWT signature/TTL/purpose)
    let profileId: string;
    try {
      ({ profileId } = verifyResetSessionToken(resetSessionToken));
    } catch {
      return res.status(401).json({ code: 'RESET_SESSION_INVALID' });
    }

    // 3) Find the ACTIVE signup row that maps to this profile
    const { data: signupRow, error: signupErr } = await supabase
      .from('user_signups')
      .select('id, status')
      .eq('profile_id', profileId)
      .eq('status', 'ACTIVE')
      .maybeSingle();

    // If mapping is missing or not ACTIVE, treat as invalid session
    if (signupErr || !signupRow) {
      return res.status(401).json({ code: 'RESET_SESSION_INVALID' });
    }

    const signupId = signupRow.id;
    const nowISO = new Date().toISOString();

    // 4) Hash and update the new password
    const pwHash = await hashPassword(newPassword);
    const { error: updateErr } = await supabase
      .from('user_signups')
      .update({ password_hash: pwHash, updated_at: nowISO })
      .eq('id', signupId);

    if (updateErr) {
      console.error('password-reset.complete.update_password.error', updateErr);
      return res.status(500).json({ code: 'INTERNAL' });
    }

    // 5) Revoke all existing refresh tokens (logout other devices/sessions)
    try {
      await invalidateRefreshToken(signupId);
    } catch (e: any) {
      console.error('password-reset.complete.invalidate_refresh.error', e?.message || e);
    }

    console.info('password-reset.complete.success', { profileId, signupId });

    return res.status(200).json({
      success: true,
      message: 'Password has been reset',
    });
  } catch (err: any) {
    console.error('password-reset.complete.error', err?.message || err);
    return res.status(500).json({ code: 'INTERNAL' });
  }
});

/**
 * Story 1.17 – Resend Password Reset OTP
 */
router.post('/auth/password/resend-otp', requestResetLimiter, async (req, res) => {
  const parsed = RequestPasswordResetSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', details: parsed.error.flatten() });
  }
  const emailLower = parsed.data.email.toLowerCase();

  const result = await processResetOtpRequest(
    emailLower,
    'If this email exists, a new code has been sent.',
    'password-reset.resend'
  );

  return res.status(200).json(result);
});

/**
 * Story 1.18 – Cancel Password Reset
 */
router.post('/auth/password/cancel', requestResetLimiter, async (req, res) => {
  const parsed = RequestPasswordResetSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', details: parsed.error.issues });
  }

  const emailLower = parsed.data.email.toLowerCase();
  const result = await processCancelResetOtp(emailLower);
  return res.status(200).json(result);
});

export default router;
