import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';

let app: ReturnType<Awaited<typeof import('../src/app')>["createApp"]>;
const mockJwtVerify = vi.fn();
vi.mock('jsonwebtoken', () => ({
    default: { verify: mockJwtVerify },
    verify: mockJwtVerify,
}));

async function buildApp() {
    const mod = await import('../src/app');
    return mod.createApp();
}

const route = '/api/lookup/majors';

const mockMajors = [
    { id: 12, name: 'Software Engineering' },
    { id: 13, name: 'Mechanical Engineering' },
];

beforeEach(async () => {
    await vi.resetModules();
    vi.doMock('../src/lib/supabase', () => ({
        supabase: {
            from: (table: string) => {
                if (table === 'majors') {
                    return {
                        select: () => ({
                            order: () => ({ data: mockMajors, error: null })
                        })
                    };
                }
                // fallback
                return { select: () => ({ order: () => ({ data: [], error: null }) }) };
            }
        }
    }));
    app = await buildApp();
});

describe('GET /api/lookup/majors', () => {
    it('401: returns NOT_AUTHENTICATED if no Authorization header', async () => {
        const res = await request(app).get(route);
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ code: 'NOT_AUTHENTICATED' });
    });

    it('401: returns NOT_AUTHENTICATED if JWT is invalid', async () => {
        mockJwtVerify.mockImplementation(() => { throw new Error('bad token'); });
        const res = await request(app)
            .get(route)
            .set('Authorization', 'Bearer badtoken');
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ code: 'NOT_AUTHENTICATED' });
    });

    it('200: returns all majors sorted by name', async () => {
        mockJwtVerify.mockReturnValue({ sub: 'user-123' });
        const res = await request(app)
            .get(route)
            .set('Authorization', 'Bearer validtoken');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ majors: mockMajors });
    });
});
