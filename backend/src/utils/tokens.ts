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

export async function invalidateRefreshToken(userId: string): Promise<void> {
  // Increment token version to invalidate all existing tokens
  await supabase.rpc('increment_token_version', { user_id: userId });
}

export async function verifyTokenVersion(userId: string, tokenVersion: number): Promise<boolean> {
  const { data: user } = await supabase
    .from('user_signups')
    .select('token_version')
    .eq('id', userId)
    .single();
  
  return user?.token_version === tokenVersion;
}

export async function generateAccessToken(userId: string): Promise<string> {
  // Get current token version from database
  const { data: user } = await supabase
    .from('user_signups')
    .select('token_version')
    .eq('id', userId)
    .single();
  
  const tokenVersion = user?.token_version || 1;
  
  return jwt.sign({ 
    sub: userId, 
    tokenVersion 
  }, process.env.JWT_SECRET!, { expiresIn: '15m' });
}

export async function generateRefreshToken(userId: string): Promise<string> {
  // Get current token version from database
  const { data: user } = await supabase
    .from('user_signups')
    .select('token_version')
    .eq('id', userId)
    .single();
  
  const tokenVersion = user?.token_version || 1;
  
  return jwt.sign({ 
    sub: userId, 
    tokenVersion 
  }, process.env.JWT_SECRET!, { expiresIn: '7d' });
}
