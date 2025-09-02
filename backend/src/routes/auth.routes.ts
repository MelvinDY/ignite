import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { RegisterSchema } from '../validation/auth.schemas';
import { hashPassword } from '../utils/crypto';
import { makeResumeToken } from '../utils/tokens';

const router = Router();

router.post('/auth/register', async (req, res) => {
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
    // If your SDK has getUserByEmail, prefer that. Otherwise list & filter (fine in dev).
    let emailExists = false;
    try {
      // @ts-ignore: some versions expose getUserByEmail
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
      return res.status(409).json({
        code: 'PENDING_VERIFICATION_EXISTS',
        resumeToken: makeResumeToken(pendingByZid.id),
      });
    }

    // 5) revival: EXPIRED by email
    const { data: expiredByEmail } = await supabase
      .from('user_signups')
      .select('id')
      .eq('signup_email', emailLower)
      .eq('status', 'EXPIRED')
      .maybeSingle();

    if (expiredByEmail) {
      const { data: revived, error: reviveErr } = await supabase
        .from('user_signups')
        .update({
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
          updated_at: new Date().toISOString(),
        })
        .eq('id', expiredByEmail.id)
        .select('id')
        .single();
      if (reviveErr) throw reviveErr;

      return res.status(201).json({
        success: true,
        userId: revived.id,                // signup id (staging)
        resumeToken: makeResumeToken(revived.id),
      });
    }

    // 6) revival: EXPIRED by zID
    const { data: expiredByZid } = await supabase
      .from('user_signups')
      .select('id')
      .eq('zid', zid)
      .eq('status', 'EXPIRED')
      .maybeSingle();

    if (expiredByZid) {
      const { data: revived, error: reviveErr } = await supabase
        .from('user_signups')
        .update({
          signup_email: emailLower,
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

      return res.status(201).json({
        success: true,
        userId: revived.id,
        resumeToken: makeResumeToken(revived.id),
      });
    }

    // 7) fresh PENDING row in user_signups
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

    return res.status(201).json({
      success: true,
      userId: created.id,                 // signup id
      resumeToken: makeResumeToken(created.id),
    });
  } catch (err: any) {
    console.error('register.error', err?.message || err);
    return res.status(500).json({ code: 'INTERNAL' });
  }
});

export default router;
