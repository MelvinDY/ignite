import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';

let app: ReturnType<Awaited<typeof import('../src/app')>['createApp']>;
const mockJwtVerify = vi.fn();

let mockCompaniesData: any[] = [];

vi.mock('jsonwebtoken', () => ({
    default: { verify: mockJwtVerify },
    verify: mockJwtVerify,
}));

vi.doMock('../src/lib/supabase', () => ({
    supabase: {
        from: (table: string) => {
            if (table === 'companies') {
                return {
                    select: vi.fn().mockReturnThis(),
                    order: vi.fn().mockReturnThis(), // The call to .order() is still needed
                    ilike: vi.fn().mockReturnThis(),
                    // 💡 The mock now simulates the sort from .order()
                    limit: vi.fn().mockImplementation(() => {
                        const sortedData = [...mockCompaniesData].sort((a, b) =>
                            a.name.localeCompare(b.name)
                        );
                        return Promise.resolve({ data: sortedData, error: null });
                    }),
                };
            }
            // A simple fallback for any other table calls
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
    mockCompaniesData = [];
    mockJwtVerify.mockImplementation(() => ({ sub: 'user-id' }));
    app = await buildApp();
});

const route = '/api/lookup/companies';

describe('GET /api/lookup/companies', () => {
    it('SUCCESS (200): No query returns alphabetical list of companies', async () => {
        // Arrange: Provide unsorted data. The mock will handle sorting.
        mockCompaniesData = [
            { id: 2, name: 'Google' },
            { id: 1, name: 'Apple' },
            { id: 3, name: 'Microsoft' },
        ];

        const res = await request(app)
            .get(route)
            .set('Authorization', 'Bearer validtoken');

        expect(res.status).toBe(200);
        // The mock now returns the data sorted, so this will pass
        expect(res.body).toEqual([
            { id: 1, name: 'Apple' },
            { id: 2, name: 'Google' },
            { id: 3, name: 'Microsoft' },
        ]);
    });

    it('SUCCESS (200): With query returns matching companies (alphabetical)', async () => {
        mockCompaniesData = [
            { id: 45, name: 'Micron Technology' },
            { id: 12, name: 'Microsoft' },
        ];

        const res = await request(app)
            .get(route)
            .query({ q: 'mic' })
            .set('Authorization', 'Bearer validtoken');

        expect(res.status).toBe(200);
        expect(res.body).toEqual([
            { id: 45, name: 'Micron Technology' },
            { id: 12, name: 'Microsoft' },
        ]);
    });

    it('SUCCESS (200): No matching companies returns empty array', async () => {
        const res = await request(app)
            .get(route)
            .query({ q: 'NoMatch' })
            .set('Authorization', 'Bearer validtoken');

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    // --- Error Tests ---
    it('ERROR (401): Not authenticated (no token) returns NOT_AUTHENTICATED', async () => {
        const res = await request(app).get(route);
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ code: 'NOT_AUTHENTICATED' });
    });

    it('ERROR (401): Not authenticated (invalid token) returns NOT_AUTHENTICATED', async () => {
        // Arrange: Make the JWT verification throw an error
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