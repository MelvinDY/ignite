import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { makeLoginSupabaseMock, mockMaybeSingle } from './utils/loginSupabaseMock';

const mockJwtVerify = vi.fn();
vi.mock('jsonwebtoken', () => ({
  default: {
    verify: mockJwtVerify,
  },
  verify: mockJwtVerify,
}));

const mockGenerateAccessToken = vi.fn();
const mockGenerateRefreshToken = vi.fn();
const mockInvalidateRefreshToken = vi.fn();
const mockVerifyTokenVersion = vi.fn();

vi.doMock('../src/utils/tokens', async (importOriginal) => {
  const original = await importOriginal<typeof import('../src/utils/tokens')>();
  return {
    ...original,
    generateAccessToken: mockGenerateAccessToken,
    generateRefreshToken: mockGenerateRefreshToken,
    invalidateRefreshToken: mockInvalidateRefreshToken,
    verifyTokenVersion: mockVerifyTokenVersion,
  };
});

let app: ReturnType<Awaited<typeof import('../src/app')>['createApp']>;

async function buildApp() {
  const mod = await import('../src/app');
  return mod.createApp();
}

beforeEach(async () => {
  vi.resetAllMocks();
  await vi.resetModules();
  vi.doMock('../src/lib/supabase', () => ({
    supabase: makeLoginSupabaseMock(),
  }));
  app = await buildApp();
});

describe('POST /auth/logout', () => {
  const testUser = {
    id: 'test-user-id',
    signup_email: 'test@example.com',
    full_name: 'Test User',
    zid: 'z1234567',
    level: 'undergrad' as const,
    year_intake: 2023,
    is_indonesian: true,
    program: 'Computer Science',
    major: 'Software Engineering',
    password_hash: 'hashed-password',
    status: 'ACTIVE' as const,
    token_version: 1,
  };

  it('should successfully logout with valid refresh token', async () => {
    // Mock JWT verification
    mockJwtVerify.mockReturnValue({
      sub: testUser.id,
      tokenVersion: 1,
    });

    // Mock token version verification
    mockVerifyTokenVersion.mockResolvedValue(true);

    const response = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', 'refreshToken=valid-token')
      .expect(200);

    expect(response.body).toEqual({ success: true });
    expect(mockInvalidateRefreshToken).toHaveBeenCalledWith(testUser.id);
  });

  it('should clear refresh token cookie on successful logout', async () => {
    // Mock JWT verification
    mockJwtVerify.mockReturnValue({
      sub: testUser.id,
      tokenVersion: 1,
    });

    // Mock token version verification
    mockVerifyTokenVersion.mockResolvedValue(true);

    const response = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', 'refreshToken=valid-token')
      .expect(200);

    // Check that Set-Cookie header clears the cookie
    const setCookieHeader = response.headers['set-cookie'];
    expect(setCookieHeader).toBeDefined();
    
    const refreshTokenCookie = setCookieHeader.find((cookie: string) => 
      cookie.startsWith('refreshToken=')
    );
    expect(refreshTokenCookie).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
    expect(refreshTokenCookie).toContain('HttpOnly');
    if (process.env.NODE_ENV === 'production') {
      expect(refreshTokenCookie).toContain('Secure');
    } else {
      expect(refreshTokenCookie).not.toContain('Secure');
    }
    expect(refreshTokenCookie).toContain('SameSite=Lax');
  });

  it('should return 401 when no refresh token cookie is provided', async () => {
    const response = await request(app)
      .post('/api/auth/logout')
      .expect(401);

    expect(response.body).toEqual({ code: 'NOT_AUTHENTICATED' });
  });

  it('should return 401 when refresh token is invalid', async () => {
    // Mock JWT verification to throw error
    mockJwtVerify.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    const response = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', 'refreshToken=invalid-token')
      .expect(401);

    expect(response.body).toEqual({ code: 'NOT_AUTHENTICATED' });
  });

  it('should return 401 when refresh token is malformed', async () => {
    // Mock JWT verification to throw error
    mockJwtVerify.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    const response = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', 'refreshToken=malformed.jwt.token')
      .expect(401);

    expect(response.body).toEqual({ code: 'NOT_AUTHENTICATED' });
  });

  it('should be idempotent - multiple logout calls should return 200', async () => {
    // Mock JWT verification
    mockJwtVerify.mockReturnValue({
      sub: testUser.id,
      tokenVersion: 1,
    });

    // First call - token is valid
    mockVerifyTokenVersion.mockResolvedValueOnce(true);
    
    const response1 = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', 'refreshToken=valid-token')
      .expect(200);

    expect(response1.body).toEqual({ success: true });

    // Second call - token is already invalidated (idempotent)
    mockVerifyTokenVersion.mockResolvedValueOnce(false);
    
    const response2 = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', 'refreshToken=valid-token')
      .expect(200);

    expect(response2.body).toEqual({ success: true });
  });

  it('should handle database errors gracefully', async () => {
    // Mock JWT verification
    mockJwtVerify.mockReturnValue({
      sub: testUser.id,
      tokenVersion: 1,
    });

    // Mock token version verification
    mockVerifyTokenVersion.mockResolvedValue(true);
    
    // Mock database error
    mockInvalidateRefreshToken.mockRejectedValue(new Error('Database error'));

    const response = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', 'refreshToken=valid-token')
      .expect(500);

    expect(response.body).toEqual({ code: 'INTERNAL' });
  });
});
