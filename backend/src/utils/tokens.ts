import jwt, { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const RES_PREFIX = 'res_';
const ISSUER = process.env.JWT_ISSUER || 'ignite-api';
const AUDIENCE = process.env.JWT_AUDIENCE || 'signup-flow';

type ResumeClaims = JwtPayload & {
  purpose: 'SIGNUP';
  sub: string; // userId
};

export function makeResumeToken(userId: string) {
  const token = jwt.sign(
    { sub: userId, purpose: 'SIGNUP', aud: AUDIENCE },
    JWT_SECRET,
    { expiresIn: '30m', issuer: ISSUER }
  );
  return RES_PREFIX + token;
}

/**
 * Verify a resume token. Throws on invalid/expired/purpose mismatch.
 * Returns the userId (sub) if valid.
 */
export function verifyResumeToken(resumeToken: string): { userId: string } {
  if (!resumeToken || !resumeToken.startsWith(RES_PREFIX)) {
    throw new Error('RESUME_TOKEN_INVALID');
  }
  const raw = resumeToken.slice(RES_PREFIX.length);

  let decoded: ResumeClaims;
  try {
    decoded = jwt.verify(raw, JWT_SECRET, {
      issuer: ISSUER,
      audience: AUDIENCE,
      clockTolerance: 5,
    }) as ResumeClaims;
  } catch {
    throw new Error('RESUME_TOKEN_INVALID');
  }

  if (decoded.purpose !== 'SIGNUP' || !decoded.sub) {
    throw new Error('RESUME_TOKEN_INVALID');
  }
  return { userId: decoded.sub };
}
