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
  RequestPasswordResetSchema
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
} from "../utils/tokens";
import { rateLimit } from "../middlewares/rateLimit";
import {
  loadPendingSignup,
  hashOtp,
  activateUser,
  bumpAttemptsOrLock,
  deleteSignupOtp,
  getSignupOtp,
  issueSignupOtp,
  issueResetPasswordOtp,
  generateOtp,
  getResetPasswordOtp
} from "../services/otp.service";
import { applyProgramAndMajorFromSignupToProfile, ensureProfileForSignup } from "../services/profile.service";
import * as jwt from "jsonwebtoken";
import {
  completePendingEmailChange,
  createPendingEmailChange,
  getPendingEmailChange,
  updateEmailChangeAttempts,
  resendEmailChangeOtp,
} from "../services/email.service";

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
    const { data: row } = await supabase
      .from("user_signups")
      .select("id, status, password_hash")
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

    const accessToken = await generateAccessToken(row.id);
    const refreshToken = await generateRefreshToken(row.id);

    // Set refresh token cookie (HttpOnly, Secure, SameSite=Lax)
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    console.info("login.success", { userId: row.id });
    return res.status(200).json({
      success: true,
      userId: row.id,
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
        secure: true,
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
      secure: true,
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
    console.error("change-email-pre-verify.error", err?.message || err);
    return res.status(500).json({ code: "INTERNAL" });
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
    const userId = decoded.sub;

    const { data: userRow } = await supabase
      .from("user_signups")
      .select("password_hash, full_name")
      .eq("id", userId)
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

    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", newEmailLowered)
      .eq("status", "ACTIVE")
      .maybeSingle();

    if (existingUser) {
      return res
        .status(409)
        .json({ code: "EMAIL_EXISTS", details: "Given email is already used" });
    }

    const otp = generateOtp();
    await createPendingEmailChange(userId, newEmailLowered, otp);

    if (!userRow.full_name) {
      return res
        .status(404)
        .json({ code: "USER_NOT_FOUND", details: "User has no full name" });
    }

    await issueSignupOtp(userId, newEmailLowered, userRow.full_name);
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
      userId,
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

    if (!pendingChange) {
      return res.status(404).json({ code: "NO_PENDING_EMAIL_CHANGE" });
    }

    if (pendingChange.locked_at) {
      return res.status(423).json({ code: "OTP_LOCKED" });
    }

    if (new Date(pendingChange.otp_expires_at) < new Date()) {
      return res.status(400).json({ code: "OTP_EXPIRED" });
    }

    if (!(hashOtp(otp) === pendingChange.otp_hash)) {
      const newAttempts = pendingChange.otp_attempts + 1;

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
      secure: true,
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

      const lastSent = new Date(pendingChange.last_otp_sent_at).getTime();
      const now = Date.now();
      const cooldownMs = 60 * 1000;

      if (now - lastSent < cooldownMs) {
        return res.status(429).json({ code: "OTP_COOLDOWN" });
      }

      if (pendingChange.resend_count >= 5) {
        return res.status(429).json({ code: "OTP_RESEND_LIMIT" });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await resendEmailChangeOtp(userId, otp);

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .single();

      await issueSignupOtp(
        pendingChange.pending_email,
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

router.delete("/user/email/cancel-change", async (req, res) => {
  const accessToken = req.headers.authorization?.split(" ")[1];

  if (!accessToken) {
    return res.status(401).json({ code: "NOT_AUTHENTICATED" });
  }

  const decoded = jwt.verify(accessToken, process.env.JWT_SECRET!) as any;
  const userId = decoded.sub;

  try {
    // Delete the pending instance from the database
    await supabase
      .from("pending_email_changes")
      .delete()
      .eq("user_id", userId);
    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("resend-email-change-otp.error", err?.message || err);
    return res.status(500).json({ code: "INTERNAL" });
  }
});

// request reset password limiter to reduce spam (still returns 200 on pass/fail)
// 5 attempts every 10 minutes
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

  // Generic 200 Response
  const generic = { success: true, message: 'If this email exists, a code has been sent.' };

  try {
    // 2) find ACTIVE profile by email
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('id, status, full_name, email')
      .eq('email', emailLower)
      .eq('status', 'ACTIVE')
      .maybeSingle();

    if (profileErr) {
      console.error('password-reset.request.profile_lookup.error', profileErr);
      return res.status(200).json(generic);
    }

    // 3) If no profile or not ACTIVE → return generic (no OTP)
    if (!profile || profile.status !== 'ACTIVE') {
      return res.status(200).json(generic);
    }

    // 4) Enforce cooldown (≥60s) and daily cap (≤5/day) using user_otps record
    const { data: otpRow, error: otpLookupErr } = await getResetPasswordOtp(profile.id);
    if (otpLookupErr) {
      console.error('password-reset.request.otp_lookup.error', otpLookupErr);
      return res.status(200).json(generic);
    }

    const now = new Date();
    let canSend = true;

    if (otpRow) {
      // Cooldown: ≥60s since last_sent_at
      if (otpRow.last_sent_at) {
        const last = new Date(otpRow.last_sent_at);
        const diffSec = Math.floor((now.getTime() - last.getTime()) / 1000);
        if (diffSec < 60) {
          canSend = false;
        }
      }

      // Daily cap: ≤5/day (based on last_sent_at's date vs today)
      if (canSend) {
        const lastDate = otpRow.last_sent_at ? new Date(otpRow.last_sent_at) : null;
        const isSameDay = lastDate
          ? lastDate.toDateString() === now.toDateString()
          : false;
        const resendCountToday = isSameDay ? (otpRow.resend_count || 0) : 0;
        if (resendCountToday >= 5) {
          canSend = false;
        }
      }

      // If locked, do not send OTP
      if (otpRow.locked_at) {
        canSend = false;
      }
    }

    // 5) If can send, issue/reset OTP row and email it
    if (canSend) {
      try {
        await issueResetPasswordOtp(profile.id, emailLower, profile.full_name);
        console.info('password-reset.request.issued', { profileId: profile.id });
      } catch (issueErr: any) {
        console.error('password-reset.request.issue.error', issueErr?.message || issueErr);
      }
    } else {
      console.info('password-reset.request.rate_limited', {
        profileId: profile.id,
        reason: 'cooldown_or_daily_cap',
      });
    }

    return res.status(200).json(generic);
  } catch (err: any) {
    console.error('password-reset.request.error', err?.message || err);
    return res.status(200).json({
      success: true,
      message: 'If this email exists, a code has been sent.',
    });
  }
});

export default router;
