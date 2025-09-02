// src/utils/tokens.ts
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export function makeResumeToken(userId: string) {
  // keep it simple for now
  return 'res_' + jwt.sign({ sub: userId, purpose: 'SIGNUP' }, JWT_SECRET, { expiresIn: '30m' });
}
