import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { type Scenario, makeSupabaseMock } from './utils/supabaseMock';

let app: ReturnType<Awaited<typeof import('../src/app')>['createApp']>;
let scenario: Scenario;
let updateError: any;
let mockEnsureProgramId: any;
let mockEnsureMajorId: any;

const mockJwtVerify = vi.fn();
vi.mock('jsonwebtoken', () => ({
  default: { verify: mockJwtVerify },
  verify: mockJwtVerify,
}));

// Mock the lookup services
vi.mock('../src/services/lookups.service', () => ({
  ensureProgramId: vi.fn(),
  ensureMajorId: vi.fn(),
}));

async function buildApp() {
  const mod = await import('../src/app');
  return mod.createApp();
}

const patchRoute = '/api/profile';

beforeEach(async () => {
  await vi.resetModules();
  scenario = {
    adminUserByEmail: null,
    adminListUsers: [],
    activeProfileByEmail: null,
    activeProfileByZid: null,
    pendingByEmail: null,
    pendingByZid: null,
    expiredByZid: null,
    expiredByEmail: null,
    createdSignupId: 'signup-created-1',
    revivedSignupId: 'signup-revived-1',
  };
  updateError = null;

  // Setup lookup service mocks
  const { ensureProgramId, ensureMajorId } = await import('../src/services/lookups.service');
  mockEnsureProgramId = ensureProgramId as any;
  mockEnsureMajorId = ensureMajorId as any;
  
  // Default successful lookups
  mockEnsureProgramId.mockResolvedValue(1); // Return program ID 1
  mockEnsureMajorId.mockResolvedValue(1);   // Return major ID 1

  vi.doMock('../src/lib/supabase', () => ({
    supabase: {
      from: (table: string) => {
        if (table === 'profiles') {
          return {
            update: () => ({
              eq: () => ({ data: {}, error: updateError })
            })
          };
        }
        return makeSupabaseMock(scenario).from(table);
      }
    }
  }));
  app = await buildApp();
});

describe('PATCH /api/profile', () => {
  it('200: successfully updates valid profile fields', async () => {
    mockJwtVerify.mockReturnValue({ sub: 'user-123' });
    const res = await request(app)
      .patch(patchRoute)
      .set('Authorization', 'Bearer validtoken')
      .send({
        fullName: 'John Doe',
        headline: 'Frontend Engineer @ Acme | AI/ML',
        isIndonesian: false,
        program: 'BSC',
        major: 'Data Science',
        level: 'undergrad',
        yearStart: 2022,
        yearGrad: 2030,
        domicileCity: 'Jakarta',
        domicileCountry: 'ID',
        bio: 'I ship non-boring, non-reliable services.'
      });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  it('200: handles empty update payload', async () => {
    mockJwtVerify.mockReturnValue({ sub: 'user-123' });
    const res = await request(app)
      .patch(patchRoute)
      .set('Authorization', 'Bearer validtoken')
      .send({});
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  it('401 NOT_AUTHENTICATED: no authorization header', async () => {
    const res = await request(app)
      .patch(patchRoute)
      .send({ fullName: 'John Doe' });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ code: 'NOT_AUTHENTICATED' });
  });

  it('401 NOT_AUTHENTICATED: invalid authorization header', async () => {
    mockJwtVerify.mockImplementation(() => { throw new Error('bad token'); });
    const res = await request(app)
      .patch(patchRoute)
      .set('Authorization', 'Bearer badtoken')
      .send({ fullName: 'John Doe' });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ code: 'NOT_AUTHENTICATED' });
  });

  it('400 VALIDATION_ERROR: invalid country code', async () => {
    mockJwtVerify.mockReturnValue({ sub: 'user-123' });
    const res = await request(app)
      .patch(patchRoute)
      .set('Authorization', 'Bearer validtoken')
      .send({ domicileCountry: 'USA' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('400 VALIDATION_ERROR: yearGrad is before yearStart', async () => {
    mockJwtVerify.mockReturnValue({ sub: 'user-123' });
    const res = await request(app)
      .patch(patchRoute)
      .set('Authorization', 'Bearer validtoken')
      .send({ 
        yearStart: 2024,
        yearGrad: 2022
      });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('400 VALIDATION_ERROR: invalid level enum', async () => {
    mockJwtVerify.mockReturnValue({ sub: 'user-123' });
    const res = await request(app)
      .patch(patchRoute)
      .set('Authorization', 'Bearer validtoken')
      .send({ level: 'masters' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});
