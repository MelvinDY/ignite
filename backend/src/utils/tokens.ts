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
  return new Date(Date.now() + 30 * 60 * 1000).toISOString(); // +30m
}

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