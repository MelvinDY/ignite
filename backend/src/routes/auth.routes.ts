import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { LoginSchema, RegisterSchema } from '../validation/auth.schemas';
import { hashPassword, verifyPassword } from '../utils/crypto';
import { hashResumeToken, makeResumeToken, resumeExpiryISO } from '../utils/tokens';
import { issueSignupOtp } from '../services/otp.service';
import { rateLimit } from '../middlewares/rateLimit';

const router = Router();

// 5 requests / 15 minutes per (IP+email) for login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => {
    const emailLower = (req.body?.email || '').toLowerCase();
    return `${req.ip}:${emailLower}`;
  },
});

// 10 requests / hour per (IP+email) for register
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => {
    const emailLower = (req.body?.email || '').toLowerCase();
    // If body is empty/malformed, still bucket by IP so it doesn't bypass
    return `${req.ip}:${emailLower}`;
  },
});

/**
 * User Login
 */
router.post('/auth/login', loginLimiter, async (req, res) => {
  // 1) validate
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', details: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;
  const emailLower = email.toLowerCase();

  try {
    // 2) Check if user exists in Supabase Auth (active users)
    let authUser = null;
    try {
      const byEmail = await (supabase as any).auth.admin.getUserByEmail?.(emailLower);
      authUser = byEmail?.data?.user;
    } catch {
      // Fallback to list users if getUserByEmail not available
      const page1 = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
      authUser = page1.data?.users?.find((u) => (u.email || '').toLowerCase() === emailLower);
    }

    if (!authUser) {
      return res.status(401).json({ code: 'INVALID_CREDENTIALS' });
    }

    // Check if email is verified
    if (!authUser.email_confirmed_at) {
      return res.status(403).json({ code: 'ACCOUNT_NOT_VERIFIED' });
    }

    // 3) Get user profile with password hash
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, password_hash')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();

    if (!profile || !profile.password_hash) {
      return res.status(401).json({ code: 'INVALID_CREDENTIALS' });
    }

    // 4) Verify password
    const isPasswordValid = await verifyPassword(password, profile.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ code: 'INVALID_CREDENTIALS' });
    }

    // 5) Generate access token (using Supabase's createSigninToken or create JWT)
    // For now, we'll create a simple response - you might want to implement proper JWT
    const response = {
      success: true,
      userId: authUser.id,
      accessToken: `temp_token_${authUser.id}_${Date.now()}`, // Replace with proper JWT
      expiresIn: 3600, // 1 hour
    };

    // logging
    console.info('login.successful', { userId: authUser.id });

    return res.status(200).json(response);
  } catch (err: any) {
    console.error('login.error', err?.message || err);
    return res.status(500).json({ code: 'INTERNAL' });
  }
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
    // 2) EMAIL already ACTIVE? (check Supabase Auth users)
    // If your SDK has getUserByEmail, prefer that. Otherwise list & filter (fine in dev, for now)
    let emailExists = false;
    try {
      const byEmail = await (supabase as any).auth.admin.getUserByEmail?.(emailLower);
      emailExists = !!byEmail?.data?.user;
    } catch { /* fall back to list */ }
    if (!emailExists) {
      const page1 = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
      emailExists = !!page1.data?.users?.some((u) => (u.email || '').toLowerCase() === emailLower);
    }
    if (emailExists) return res.status(409).json({ code: 'EMAIL_EXISTS' });

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

export default router;
