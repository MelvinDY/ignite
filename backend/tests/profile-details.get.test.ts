import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { type Scenario, makeSupabaseMock } from './utils/supabaseMock';

let app: ReturnType<Awaited<typeof import('../src/app')>['createApp']>;
let scenario: Scenario;
let mockProfileData: any;

const mockJwtVerify = vi.fn();
vi.mock('jsonwebtoken', () => ({
	default: { verify: mockJwtVerify },
	verify: mockJwtVerify,
}));

async function buildApp() {
	const mod = await import('../src/app');
	return mod.createApp();
}

beforeEach(async () => {
	await vi.resetModules();
	
	// Reset scenario
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

	// Mock profile data for testing
	mockProfileData = {
		id: 'profile-123',
		full_name: 'Test User',
		handle: 'testuser',
		photo_url: 'https://example.com/photo.jpg',
		is_indonesian: true,
		program_id: 2,
		major_id: 5,
		level: 'undergrad',
		year_start: 2020,
		year_grad: 2024,
		zid: 'z1234567',
		headline: 'Software Engineer',
		domicile_city: 'Sydney',
		domicile_country: 'AU',
		bio: 'Passionate about building innovative software solutions.',
		social_links: {
			linkedin: 'https://www.linkedin.com/in/testuser',
			github: 'https://github.com/testuser',
			website: 'https://testuser.dev'
		},
		created_at: '2024-01-15T10:30:00Z',
		updated_at: '2024-03-20T14:45:00Z'
	};

	// Custom supabase mock for profiles table
	vi.doMock('../src/lib/supabase', () => ({
		supabase: {
			from: (table: string) => {
				if (table === 'profiles') {
					return {
						select: () => ({
							eq: (col: string, val: any) => ({
								single: () => {
									// Return mock profile data when querying by ID
									if (col === 'id' && val === 'profile-123') {
										return { data: mockProfileData, error: null };
									}
									// Return null for non-existent profiles
									return { data: null, error: { code: 'PGRST116', message: 'Row not found' } };
								}
							})
						})
					};
				}
				// Fallback to default mock for other tables
				return makeSupabaseMock(scenario).from(table);
			},
		},
	}));

	app = await buildApp();
});

const route = '/api/profile/me';

describe('GET /api/profile/me', () => {
	it('200 success: retrieve user data', async () => {
		mockJwtVerify.mockReturnValue({ sub: 'profile-123' });

		const res = await request(app)
			.get(route)
			.set('Authorization', 'Bearer validtoken');

		expect(res.status).toBe(200);
		expect(res.body).toEqual({
			id: 'profile-123',
			fullName: 'Test User',
			handle: 'testuser',
			photoUrl: 'https://example.com/photo.jpg',
			isIndonesian: true,
			programId: 2,
			majorId: 5,
			level: 'undergrad',
			yearStart: 2020,
			yearGrad: 2024,
			zid: 'z1234567',
			headline: 'Software Engineer',
			domicileCity: 'Sydney',
			domicileCountry: 'AU',
			bio: 'Passionate about building innovative software solutions.',
			socialLinks: {
				linkedin: 'https://www.linkedin.com/in/testuser',
				github: 'https://github.com/testuser',
				website: 'https://testuser.dev'
			},
			createdAt: '2024-01-15T10:30:00Z',
			updatedAt: '2024-03-20T14:45:00Z'
		});
	});

	it('401 NOT_AUTHENTICATED: no Authorization header', async () => {
		const res = await request(app).get(route);
		expect(res.status).toBe(401);
		expect(res.body).toEqual({ code: 'NOT_AUTHENTICATED' });
	});

	it('401 NOT_AUTHENTICATED: invalid Authorization header', async () => {
		mockJwtVerify.mockReturnValue({ sub: 'invalid-auth' });
		
		const res = await request(app).get(route);
		expect(res.status).toBe(401);
		expect(res.body).toEqual({ code: 'NOT_AUTHENTICATED' });
	});
});
