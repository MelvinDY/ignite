import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';

let app: ReturnType<Awaited<typeof import('../src/app')>['createApp']>;
const mockJwtVerify = vi.fn();

let mockWorkFieldsData: any[] = [];

vi.mock('jsonwebtoken', () => ({
    default: { verify: mockJwtVerify },
    verify: mockJwtVerify,
}));

vi.doMock('../src/lib/supabase', () => ({
    supabase: {
        from: (table: string) => {
            if (table === 'fields_of_work') {
                return {
                    select: vi.fn().mockReturnThis(),
                    order: vi.fn().mockImplementation(() => {
                        const sortedData = [...mockWorkFieldsData].sort((a, b) =>
                            a.name.localeCompare(b.name)
                        );
                        return Promise.resolve({ data: sortedData, error: null });
                    }),
                    limit: vi.fn().mockReturnThis(),
                };
            }
            // fallback for other tables
            return {
                select: vi.fn().mockReturnThis(),
                insert: vi.fn().mockReturnThis(),
                update: vi.fn().mockReturnThis(),
                delete: vi.fn().mockReturnThis(),
                eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            };
        },
    },
}));

async function buildApp() {
    const mod = await import('../src/app');
    return mod.createApp();
}

beforeEach(async () => {
    await vi.resetModules();
    mockWorkFieldsData = [];
    mockJwtVerify.mockImplementation(() => ({ sub: 'user-id' }));
    app = await buildApp();
});

const route = '/api/lookup/work-fields';

describe('GET /api/lookup/work-fields', () => {
    it('SUCCESS (200): Returns alphabetical list of work fields', async () => {
        mockWorkFieldsData = [
            { id: 14, name: 'Marketing' },
            { id: 12, name: 'Data Science' },
            { id: 13, name: 'Software Engineering' },
        ];

        const res = await request(app)
            .get(route)
            .set('Authorization', 'Bearer validtoken');

        expect(res.status).toBe(200);
        expect(res.body).toEqual([
            { id: 12, name: 'Data Science' },
            { id: 14, name: 'Marketing' },
            { id: 13, name: 'Software Engineering' },
        ]);
    });

    it('SUCCESS (200): Returns empty array if no work fields', async () => {
        mockWorkFieldsData = [];

        const res = await request(app)
            .get(route)
            .set('Authorization', 'Bearer validtoken');

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    it('ERROR (401): Not authenticated (no token) returns NOT_AUTHENTICATED', async () => {
        const res = await request(app).get(route);
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ code: 'NOT_AUTHENTICATED' });
    });

    it('ERROR (401): Not authenticated (invalid token) returns NOT_AUTHENTICATED', async () => {
        mockJwtVerify.mockImplementationOnce(() => {
            throw new Error('Invalid token');
        });

        const res = await request(app)
            .get(route)
            .set('Authorization', 'Bearer badtoken');

        expect(res.status).toBe(401);
        expect(res.body).toEqual({ code: 'NOT_AUTHENTICATED' });
    });
});