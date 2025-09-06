// src/utils/tokens.ts
import jwt, { JwtPayload } from 'jsonwebtoken';
import crypto from 'crypto';
import { supabase } from '../lib/supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const RES_PREFIX = 'res_';
const ISSUER = process.env.JWT_ISSUER || 'ignite-api';
const AUDIENCE = process.env.JWT_AUDIENCE || 'signup-flow';

export function makeResumeToken(userId: string) {
  const token = jwt.sign({ sub: userId, purpose: 'SIGNUP', aud: AUDIENCE }, JWT_SECRET, {
    expiresIn: '30m',
    issuer: ISSUER,
  });
  return RES_PREFIX + token;
}

export function hashResumeToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function resumeExpiryISO() {
  return new Date(Date.now() + 30 * 60 * 1000).toISOString();
}

// (keep this if other places rely on sync verification)
export function verifyResumeToken(resumeToken: string): { userId: string } {
  if (!resumeToken || !resumeToken.startsWith(RES_PREFIX)) throw new Error('RESUME_TOKEN_INVALID');
  const raw = resumeToken.slice(RES_PREFIX.length);
  const decoded = jwt.verify(raw, JWT_SECRET, {
    issuer: ISSUER,
    audience: AUDIENCE,
    clockTolerance: 5,
  }) as JwtPayload & { purpose: 'SIGNUP'; sub: string };
  if (decoded.purpose !== 'SIGNUP' || !decoded.sub) throw new Error('RESUME_TOKEN_INVALID');
  return { userId: decoded.sub };
}

/**
 * NEW: strict verifier — checks JWT AND matches the DB-stored hash + DB TTL.
 * Use this in your /auth/verify-otp, /auth/resend-otp, etc.
 */
export async function verifyResumeTokenStrict(resumeToken: string): Promise<{ userId: string }> {
  // 1) Basic prefix + JWT checks
  const { userId } = verifyResumeToken(resumeToken);

  // 2) DB check against current hash+expiry (prevents reuse after rotation/invalidations)
  const { data: row, error } = await supabase
    .from('user_signups')
    .select('id, resume_token_hash, resume_token_expires_at')
    .eq('id', userId)
    .maybeSingle();

  if (error || !row || !row.resume_token_hash || !row.resume_token_expires_at) {
    throw new Error('RESUME_TOKEN_INVALID');
  }
  if (new Date(row.resume_token_expires_at).getTime() < Date.now()) {
    throw new Error('RESUME_TOKEN_INVALID');
  }

  // IMPORTANT: constant-time compare
  const presented = Buffer.from(hashResumeToken(resumeToken));
  const stored = Buffer.from(row.resume_token_hash);
  if (presented.length !== stored.length || !crypto.timingSafeEqual(presented, stored)) {
    throw new Error('RESUME_TOKEN_INVALID');
  }

  return { userId };
}

/**
 * NEW: rotate helper (centralise DB writes)
 */
export async function rotateResumeToken(signupId: string): Promise<string> {
  const resumeToken = makeResumeToken(signupId);
  await supabase
    .from('user_signups')
    .update({
      resume_token_hash: hashResumeToken(resumeToken),
      resume_token_expires_at: resumeExpiryISO(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', signupId);
  return resumeToken;
}

export async function invalidateResumeToken(userId: string): Promise<void> {
  await supabase
    .from('user_signups')
    .update({
      resume_token_hash: null,
      resume_token_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
}

export function generateAccessToken(userId: string): string {
  // (Optionally use ACCESS_TOKEN_SECRET to avoid mixing secrets)
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET!, { expiresIn: '15m' });
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET!, { expiresIn: '7d' });
}
