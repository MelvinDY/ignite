// src/routes/auth.routes.ts

import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { RegisterSchema } from '../validation/auth.schemas';
import { hashPassword } from '../utils/crypto';
import { hashResumeToken, makeResumeToken, resumeExpiryISO } from '../utils/tokens';
import { issueSignupOtp } from '../services/otp.service';
import { rateLimit } from '../middlewares/rateLimit';

import { VerifyOtpSchema } from '../validation/auth.schemas';
import { verifyResumeToken, invalidateResumeToken } from '../utils/tokens';
import {
  loadPendingSignup, hashOtp, incrementOtpAttempts, clearOtpState, activateUser,
} from '../services/otp.service';
import { ensureProfileForSignup } from '../services/profile.service';


const router = Router();

// 10 requests / hour per (IP+email)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => {
    const emailLower = (req.body?.email || '').toLowerCase();
    // If body is empty/malformed, still bucket by IP so it doesn’t bypass
    return `${req.ip}:${emailLower}`;
  },
});

// 10 attempts / 10 min per (IP+resumeToken)
const verifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => `${req.ip}:${req.body?.resumeToken || ''}`,
});


/**
 * User Stories 1.1: User Registration
 */
router.post('/auth/register', registerLimiter, async (req, res) => {
  // 1) validate
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', details: parsed.error.flatten() });
  }

  const {
    fullName, zid, level, yearIntake, isIndonesian, program, major, email, password,
  } = parsed.data;
  const emailLower = email.toLowerCase();

  try {
    // 2) reject if email already belongs to an ACTIVE user in profiles
    const { data: byEmailActive, error: emailErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', emailLower)
      .maybeSingle();

    if (emailErr) {
      // log but don't explode the request
      console.error('register.email_check.error', emailErr);
    }
    if (byEmailActive) {
      return res.status(409).json({ code: 'EMAIL_EXISTS' });
    }

    // 3) zID already ACTIVE? (profiles = ACTIVE only)
    const { data: activeByZid } = await supabase
      .from('profiles')
      .select('id')
      .eq('zid', zid)
      .maybeSingle();
    if (activeByZid) return res.status(409).json({ code: 'ZID_EXISTS' });

    // 4) pending exists (email or zid) in user_signups
    const { data: pendingByEmail } = await supabase
      .from('user_signups')
      .select('id')
      .eq('signup_email', emailLower)
      .eq('status', 'PENDING_VERIFICATION')
      .maybeSingle();
    if (pendingByEmail) {
      const resumeToken = makeResumeToken(pendingByEmail.id);

      await supabase
        .from('user_signups')
        .update({
          resume_token_hash: hashResumeToken(resumeToken),
          resume_token_expires_at: resumeExpiryISO(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', pendingByEmail.id);

      return res.status(409).json({
        code: 'PENDING_VERIFICATION_EXISTS',
        resumeToken: makeResumeToken(pendingByEmail.id),
      });
    }

    const { data: pendingByZid } = await supabase
      .from('user_signups')
      .select('id')
      .eq('zid', zid)
      .eq('status', 'PENDING_VERIFICATION')
      .maybeSingle();
    if (pendingByZid) {
      const resumeToken = makeResumeToken(pendingByZid.id);

      await supabase
        .from('user_signups')
        .update({
          resume_token_hash: hashResumeToken(resumeToken),
          resume_token_expires_at: resumeExpiryISO(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', pendingByZid.id);

      return res.status(409).json({
        code: 'PENDING_VERIFICATION_EXISTS',
        resumeToken: makeResumeToken(pendingByZid.id),
      });
    }

    // 5) revival: EXPIRED by zID (zID is the true identifier)
    const { data: expiredByZid } = await supabase
      .from('user_signups')
      .select('id, signup_email')
      .eq('zid', zid)
      .eq('status', 'EXPIRED')
      .maybeSingle();

    if (expiredByZid) {
      const { data: revived, error: reviveErr } = await supabase
        .from('user_signups')
        .update({
          signup_email: emailLower,   // update email if different
          full_name: fullName,
          level,
          year_intake: yearIntake,
          is_indonesian: isIndonesian,
          program,
          major,
          password_hash: await hashPassword(password),
          status: 'PENDING_VERIFICATION',
          email_verified_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', expiredByZid.id)
        .select('id')
        .single();
      if (reviveErr) throw reviveErr;

      await issueSignupOtp(revived.id, emailLower, fullName);

      const resumeToken = makeResumeToken(revived.id);
      await supabase
        .from('user_signups')
        .update({
          resume_token_hash: hashResumeToken(resumeToken),
          resume_token_expires_at: resumeExpiryISO(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', revived.id);
      
      // logging
      console.info('registration.created', { userId: revived.id });


      return res.status(201).json({
        success: true,
        userId: revived.id,
        resumeToken: makeResumeToken(revived.id),
      });
    }

    // guard against same email tied to another expired zID
    const { data: expiredByEmail } = await supabase
      .from('user_signups')
      .select('id, zid')
      .eq('signup_email', emailLower)
      .eq('status', 'EXPIRED')
      .maybeSingle();

    if (expiredByEmail && expiredByEmail.zid !== zid) {
      return res.status(409).json({ code: 'ZID_MISMATCH' });
    }

    // 6) fresh PENDING row in user_signups
    const { data: created, error: insertErr } = await supabase
      .from('user_signups')
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
        status: 'PENDING_VERIFICATION',
        email_verified_at: null,
      })
      .select('id')
      .single();
    if (insertErr) throw insertErr;

    // sending otp
    await issueSignupOtp(created.id, emailLower, fullName);

    const resumeToken = makeResumeToken(created.id);
      await supabase
        .from('user_signups')
        .update({
          resume_token_hash: hashResumeToken(resumeToken),
          resume_token_expires_at: resumeExpiryISO(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', created.id);

    // logging
    console.info('registration.created', { userId: created.id });

    return res.status(201).json({
      success: true,
      userId: created.id,
      resumeToken: makeResumeToken(created.id),
    });
  } catch (err: any) {
    console.error('register.error', err?.message || err);
    return res.status(500).json({ code: 'INTERNAL' });
  }
});

/**
 * User Story 1.2: Verify OTP (Activate account)
 */
router.post('/auth/verify-otp', verifyLimiter, async (req, res) => {
  const parsed = VerifyOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', details: parsed.error.flatten() });
  }

  const { resumeToken, otp } = parsed.data;

  try {
    // 1) Verify resumeToken signature/claims (JWT) and extract userId
    let userId: string;
    try {
      ({ userId } = verifyResumeToken(resumeToken));
    } catch {
      return res.status(401).json({ code: 'RESUME_TOKEN_INVALID' });
    }

    // 2) Load pending signup row
    const { data: row, error } = await loadPendingSignup(userId);
    if (error || !row) return res.status(404).json({ code: 'PENDING_NOT_FOUND' });

    if (row.status === 'ACTIVE') return res.status(409).json({ code: 'ALREADY_VERIFIED' });
    if (row.status !== 'PENDING_VERIFICATION') return res.status(404).json({ code: 'PENDING_NOT_FOUND' });

    // 3) Attempts lock
    if ((row.otp_attempts ?? 0) >= 5) return res.status(423).json({ code: 'OTP_LOCKED' });

    // 4) Expiry
    if (!row.otp_expires_at || new Date(row.otp_expires_at) < new Date()) {
      await incrementOtpAttempts(userId);
      return res.status(400).json({ code: 'OTP_EXPIRED' });
    }

    // 5) Compare hashes
    const ok = row.otp_hash && hashOtp(otp) === row.otp_hash;
    if (!ok) {
      await incrementOtpAttempts(userId);
      const after = (row.otp_attempts ?? 0) + 1;
      if (after >= 5) return res.status(423).json({ code: 'OTP_LOCKED' });
      return res.status(400).json({ code: 'OTP_INVALID' });
    }

    // 6) Success → activate, clear OTP, invalidate resume token
    const profileId = await ensureProfileForSignup(userId);
    await activateUser(userId);
    await clearOtpState(userId);
    await invalidateResumeToken(userId);


    console.info('registration.verified', { userId });
    return res.status(200).json({ success: true, message: 'Account verified successfully' });
  } catch (err: any) {
    console.error('verify-otp.error', err?.message || err);
    return res.status(500).json({ code: 'INTERNAL' });
  }
});

export default router;
