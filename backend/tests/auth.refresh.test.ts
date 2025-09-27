import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';

let app: ReturnType<Awaited<typeof import('../src/app')>['createApp']>;

async function buildApp() {
  const mod = await import('../src/app');
  return mod.createApp();
}

describe('POST /api/auth/refresh', () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    await vi.resetModules();
    // Mock supabase client to avoid requiring env vars during tests
    vi.doMock('../src/lib/supabase', () => ({ supabase: {} }));
    // Mock jsonwebtoken.verify for refresh path
    vi.doMock('jsonwebtoken', () => ({
      verify: (token: string, secret: string) => {
        if (!token || token === 'bad') throw new Error('invalid');
        return { sub: 'user-123', tokenVersion: 1 };
      },
      sign: vi.fn(),
    }));
    // Mock tokens to produce deterministic access token and verify token version
    vi.doMock('../src/utils/tokens', async (importOriginal) => {
      const original = await importOriginal<typeof import('../src/utils/tokens')>();
      return {
        ...original,
        generateAccessToken: () => 'new_access_token',
        verifyTokenVersion: () => true // Mock token version verification to always return true
      };
    });
    app = await buildApp();
  });

  it('200: returns a new access token when refresh cookie is valid', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', ['refreshToken=rft_abc'])
      .expect(200);

    expect(res.body).toMatchObject({ success: true, accessToken: 'new_access_token', userId: 'user-123', expiresIn: 86400 });
  });

  it('401: missing refresh cookie', async () => {
    await request(app).post('/api/auth/refresh').expect(401);
  });

  it('401: invalid refresh token', async () => {
    await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', ['refreshToken=bad'])
      .expect(401);
  });
});


