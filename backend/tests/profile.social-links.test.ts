import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';

let app: ReturnType<Awaited<typeof import('../src/app')>['createApp']>;

const mockJwtVerify = vi.fn();
vi.mock('jsonwebtoken', () => ({
  default: { verify: mockJwtVerify },
  verify: mockJwtVerify,
}));

async function buildApp() {
  const mod = await import('../src/app');
  return mod.createApp();
}

// In-memory “DB row” for the profile under test
let mockProfileRow: {
  id: string;
  social_links: Record<string, string> | null;
};

// Flag to simulate DB error in update
let updateShouldError = false;

beforeEach(async () => {
  await vi.resetModules();

  // Re-init JWT mock each test
  mockJwtVerify.mockReset();

  // Default profile row before each test
  mockProfileRow = {
    id: 'profile-123',
    social_links: {
      github: 'https://github.com/old',
      x: 'https://x.com/old',
    },
  };

  // No error by default
  updateShouldError = false;

  // --- Supabase mock for profiles.update().eq('id', ...) ---
  vi.doMock('../src/lib/supabase', () => ({
    supabase: {
      from: (table: string) => {
        if (table !== 'profiles') {
          // minimal no-op for other tables, should not be used here
          return {
            update: () => ({ eq: async () => ({ data: null, error: null }) }),
          } as any;
        }

        return {
          update: (patch: any) => ({
            eq: async (col: string, val: any) => {
              if (col !== 'id') return { data: null, error: null };
              if (String(val) !== mockProfileRow.id) {
                return { data: null, error: { code: 'PGRST116', message: 'Row not found' } };
              }
              if (updateShouldError) {
                return { data: null, error: { code: 'DB_ERR', message: 'update failed' } };
              }
              // FULL REPLACE of social_links as per story 2.6
              if (Object.prototype.hasOwnProperty.call(patch, 'social_links')) {
                mockProfileRow.social_links = patch.social_links ?? null;
              }
              return { data: { id: mockProfileRow.id }, error: null };
            },
          }),
        };
      },
    },
  }));

  // Build app after mocks
  app = await buildApp();
});

const ROUTE = '/api/profile/social-links';

describe('PATCH /api/profile/social-links (Story 2.6)', () => {
  it('401 NOT_AUTHENTICATED when Authorization header missing', async () => {
    const res = await request(app).patch(ROUTE).send({});
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ code: 'NOT_AUTHENTICATED' });
  });

  it('401 NOT_AUTHENTICATED when token is invalid (jwt.verify throws)', async () => {
    mockJwtVerify.mockImplementation(() => { throw new Error('bad token'); });

    const res = await request(app)
      .patch(ROUTE)
      .set('Authorization', 'Bearer badtoken')
      .send({ socialLinks: { website: 'https://janedoe.dev' } });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ code: 'NOT_AUTHENTICATED' });
  });

  it('400 VALIDATION_ERROR when unknown key is present', async () => {
    mockJwtVerify.mockReturnValue({ sub: 'profile-123' });

    const res = await request(app)
      .patch(ROUTE)
      .set('Authorization', 'Bearer validtoken')
      .send({
        socialLinks: {
          // not allowed by .strict()
          facebook: 'https://facebook.com/janedoe',
        } as any,
      });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ code: 'VALIDATION_ERROR' });
  });

  it('400 VALIDATION_ERROR when url is not https', async () => {
    mockJwtVerify.mockReturnValue({ sub: 'profile-123' });

    const res = await request(app)
      .patch(ROUTE)
      .set('Authorization', 'Bearer validtoken')
      .send({
        socialLinks: {
          github: 'http://github.com/janedoe', // http (invalid)
        },
      });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ code: 'VALIDATION_ERROR' });
  });

  it('400 VALIDATION_ERROR when hostname not allowed for provider', async () => {
    mockJwtVerify.mockReturnValue({ sub: 'profile-123' });

    const res = await request(app)
      .patch(ROUTE)
      .set('Authorization', 'Bearer validtoken')
      .send({
        socialLinks: {
          linkedin: 'https://linkedin.evil.com/in/jane', // wrong host
        },
      });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ code: 'VALIDATION_ERROR' });
  });

  it('200 success: replaces entire social_links JSON (atomic)', async () => {
    mockJwtVerify.mockReturnValue({ sub: 'profile-123' });

    // before: has github + x
    expect(mockProfileRow.social_links).toEqual({
      github: 'https://github.com/old',
      x: 'https://x.com/old',
    });

    const payload = {
      socialLinks: {
        linkedin: 'https://www.linkedin.com/in/janedoe',
        website: 'https://janedoe.dev',
      },
    };

    const res = await request(app)
      .patch(ROUTE)
      .set('Authorization', 'Bearer validtoken')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });

    // after: ONLY linkedin + website remain (full replace, not merge)
    expect(mockProfileRow.social_links).toEqual({
      linkedin: 'https://www.linkedin.com/in/janedoe',
      website: 'https://janedoe.dev',
    });
  });

  it('200 success: empty object clears social_links', async () => {
    mockJwtVerify.mockReturnValue({ sub: 'profile-123' });

    const res = await request(app)
      .patch(ROUTE)
      .set('Authorization', 'Bearer validtoken')
      .send({ socialLinks: {} });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(mockProfileRow.social_links).toEqual({});
  });

  it('500 INTERNAL when DB update fails', async () => {
    mockJwtVerify.mockReturnValue({ sub: 'profile-123' });
    updateShouldError = true;

    const res = await request(app)
      .patch(ROUTE)
      .set('Authorization', 'Bearer validtoken')
      .send({
        socialLinks: { website: 'https://janedoe.dev' },
      });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ code: 'INTERNAL' });
  });
});
