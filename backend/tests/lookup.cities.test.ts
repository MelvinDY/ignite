import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';

let app: ReturnType<Awaited<typeof import('../src/app')>['createApp']>;
const mockJwtVerify = vi.fn();

// Mock data for different endpoints
let mockMajorsData: any[] = [];
let mockCompaniesData: any[] = [];
let mockWorkFieldsData: any[] = [];
let mockCitiesData: any[] = [];

vi.mock('jsonwebtoken', () => ({
    default: { verify: mockJwtVerify },
    verify: mockJwtVerify,
}));

vi.doMock('../src/lib/supabase', () => ({
    supabase: {
        from: (table: string) => {
            if (table === 'majors') {
                return {
                    select: vi.fn().mockReturnThis(),
                    order: vi.fn().mockImplementation(() => {
                        const sortedData = [...mockMajorsData].sort((a, b) =>
                            a.name.localeCompare(b.name)
                        );
                        return Promise.resolve({ data: sortedData, error: null });
                    }),
                };
            }
            if (table === 'companies') {
                return {
                    select: vi.fn().mockReturnThis(),
                    order: vi.fn().mockReturnThis(),
                    ilike: vi.fn().mockReturnThis(),
                    limit: vi.fn().mockImplementation(() => {
                        const sortedData = [...mockCompaniesData].sort((a, b) =>
                            a.name.localeCompare(b.name)
                        );
                        return Promise.resolve({ data: sortedData, error: null });
                    }),
                };
            }
            if (table === 'fields_of_work') {
                return {
                    select: vi.fn().mockReturnThis(),
                    order: vi.fn().mockImplementation(() => {
                        const sortedData = [...mockWorkFieldsData].sort((a, b) =>
                            a.name.localeCompare(b.name)
                        );
                        return Promise.resolve({ data: sortedData, error: null });
                    }),
                };
            }
            if (table === 'profiles') {
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    not: vi.fn().mockReturnThis(),
                    order: vi.fn().mockImplementation(() => {
                        // Filter mock data to match the actual query logic:
                        // is_indonesian = true AND domicile_country = 'ID' AND status = 'ACTIVE'
                        // AND domicile_city IS NOT NULL
                        const filteredData = mockCitiesData.filter(item => 
                            item.is_indonesian === true && 
                            item.domicile_country === 'ID' && 
                            item.status === 'ACTIVE' &&
                            item.domicile_city && 
                            item.domicile_city.trim()
                        );
                        
                        const uniqueCities = [...new Set(filteredData.map(item => item.domicile_city))]
                            .filter(city => city && city.trim())
                            .sort()
                            .map(name => ({ domicile_city: name }));
                        return Promise.resolve({ data: uniqueCities, error: null });
                    }),
                };
            }
            // Fallback for any other table calls
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
    mockMajorsData = [];
    mockCompaniesData = [];
    mockWorkFieldsData = [];
    mockCitiesData = [];
    mockJwtVerify.mockImplementation(() => ({ sub: 'user-id' }));
    app = await buildApp();
});

// Test /lookup/majors endpoint
describe('GET /api/lookup/majors', () => {
    const route = '/api/lookup/majors';

    it('SUCCESS (200): Returns alphabetical list of majors', async () => {
        mockMajorsData = [
            { id: 2, name: 'Software Engineering' },
            { id: 1, name: 'Computer Science' },
            { id: 3, name: 'Mechanical Engineering' },
        ];

        const res = await request(app)
            .get(route)
            .set('Authorization', 'Bearer validtoken');

        expect(res.status).toBe(200);
        expect(res.body).toEqual([
            { id: 1, name: 'Computer Science' },
            { id: 3, name: 'Mechanical Engineering' },
            { id: 2, name: 'Software Engineering' },
        ]);
    });

    it('SUCCESS (200): Returns empty array when no majors', async () => {
        mockMajorsData = [];

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

// Test /lookup/companies endpoint
describe('GET /api/lookup/companies', () => {
    const route = '/api/lookup/companies';

    it('SUCCESS (200): No query returns alphabetical list of companies', async () => {
        mockCompaniesData = [
            { id: 2, name: 'Google', experiences: [{ id: 1 }] },
            { id: 1, name: 'Apple', experiences: [{ id: 2 }] },
            { id: 3, name: 'Microsoft', experiences: [{ id: 3 }] },
        ];

        const res = await request(app)
            .get(route)
            .set('Authorization', 'Bearer validtoken');

        expect(res.status).toBe(200);
        expect(res.body).toEqual([
            { id: 1, name: 'Apple' },
            { id: 2, name: 'Google' },
            { id: 3, name: 'Microsoft' },
        ]);
    });

    it('SUCCESS (200): With query returns matching companies (alphabetical)', async () => {
        mockCompaniesData = [
            { id: 45, name: 'Micron Technology', experiences: [{ id: 1 }] },
            { id: 12, name: 'Microsoft', experiences: [{ id: 2 }] },
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

    it('SUCCESS (200): Empty query string returns all companies', async () => {
        mockCompaniesData = [
            { id: 1, name: 'Apple', experiences: [{ id: 1 }] },
        ];

        const res = await request(app)
            .get(route)
            .query({ q: '' })
            .set('Authorization', 'Bearer validtoken');

        expect(res.status).toBe(200);
        expect(res.body).toEqual([{ id: 1, name: 'Apple' }]);
    });

    it('SUCCESS (200): No matching companies returns empty array', async () => {
        mockCompaniesData = [];

        const res = await request(app)
            .get(route)
            .query({ q: 'NoMatch' })
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

// Test /lookup/work-fields endpoint
describe('GET /api/lookup/work-fields', () => {
    const route = '/api/lookup/work-fields';

    it('SUCCESS (200): Returns alphabetical list of work fields', async () => {
        mockWorkFieldsData = [
            { id: 3, name: 'Software Engineering' },
            { id: 1, name: 'Data Science' },
            { id: 2, name: 'Product Management' },
        ];

        const res = await request(app)
            .get(route)
            .set('Authorization', 'Bearer validtoken');

        expect(res.status).toBe(200);
        expect(res.body).toEqual([
            { id: 1, name: 'Data Science' },
            { id: 2, name: 'Product Management' },
            { id: 3, name: 'Software Engineering' },
        ]);
    });

    it('SUCCESS (200): Returns empty array when no work fields', async () => {
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

// Test /lookup/cities endpoint
describe('GET /api/lookup/cities', () => {
    const route = '/api/lookup/cities';

    it('SUCCESS (200): Returns alphabetical list of Indonesian cities', async () => {
        mockCitiesData = [
            { domicile_city: 'Surabaya', is_indonesian: true, domicile_country: 'ID', status: 'ACTIVE' },
            { domicile_city: 'Bandung', is_indonesian: true, domicile_country: 'ID', status: 'ACTIVE' },
            { domicile_city: 'Jakarta', is_indonesian: true, domicile_country: 'ID', status: 'ACTIVE' },
        ];

        const res = await request(app)
            .get(route)
            .set('Authorization', 'Bearer validtoken');

        expect(res.status).toBe(200);
        expect(res.body).toEqual([
            { id: 'Bandung', name: 'Bandung' },
            { id: 'Jakarta', name: 'Jakarta' },
            { id: 'Surabaya', name: 'Surabaya' },
        ]);
    });

    it('SUCCESS (200): Filters out duplicate cities', async () => {
        mockCitiesData = [
            { domicile_city: 'Jakarta', is_indonesian: true, domicile_country: 'ID', status: 'ACTIVE' },
            { domicile_city: 'Bandung', is_indonesian: true, domicile_country: 'ID', status: 'ACTIVE' },
            { domicile_city: 'Jakarta', is_indonesian: true, domicile_country: 'ID', status: 'ACTIVE' }, // Duplicate
            { domicile_city: 'Bandung', is_indonesian: true, domicile_country: 'ID', status: 'ACTIVE' }, // Duplicate
        ];

        const res = await request(app)
            .get(route)
            .set('Authorization', 'Bearer validtoken');

        expect(res.status).toBe(200);
        expect(res.body).toEqual([
            { id: 'Bandung', name: 'Bandung' },
            { id: 'Jakarta', name: 'Jakarta' },
        ]);
    });

    it('SUCCESS (200): Returns empty array when no cities', async () => {
        mockCitiesData = [];

        const res = await request(app)
            .get(route)
            .set('Authorization', 'Bearer validtoken');

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    it('SUCCESS (200): Filters out non-Indonesian and non-active profiles', async () => {
        mockCitiesData = [
            { domicile_city: 'Jakarta', is_indonesian: true, domicile_country: 'ID', status: 'ACTIVE' },
            { domicile_city: 'Sydney', is_indonesian: false, domicile_country: 'AU', status: 'ACTIVE' }, // Non-Indonesian
            { domicile_city: 'Bandung', is_indonesian: true, domicile_country: 'ID', status: 'PENDING_VERIFICATION' }, // Not active
            { domicile_city: 'Surabaya', is_indonesian: true, domicile_country: 'US', status: 'ACTIVE' }, // Wrong country
            { domicile_city: 'Medan', is_indonesian: true, domicile_country: 'ID', status: 'ACTIVE' },
            { domicile_city: null, is_indonesian: true, domicile_country: 'ID', status: 'ACTIVE' }, // Null city
            { domicile_city: '   ', is_indonesian: true, domicile_country: 'ID', status: 'ACTIVE' }, // Empty city
        ];

        const res = await request(app)
            .get(route)
            .set('Authorization', 'Bearer validtoken');

        expect(res.status).toBe(200);
        expect(res.body).toEqual([
            { id: 'Jakarta', name: 'Jakarta' },
            { id: 'Medan', name: 'Medan' },
        ]);
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