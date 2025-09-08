import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { type Scenario, makeSupabaseMock } from './utils/supabaseMock';

let app: ReturnType<Awaited<typeof import('../src/app')>['createApp']>;
let scenario: Scenario;

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
	// Custom supabase mock for profile_skills
	vi.doMock('../src/lib/supabase', () => ({
		supabase: {
			from: (table: string) => {
				if (table === 'profile_skills') {
					return {
						select: () => ({
							eq: (_col: string, _val: any) => ({
								data: [
									{ skills: { id: 1, name: 'React' } },
									{ skills: { id: 2, name: 'Node.js' } },
									{ skills: { id: 3, name: 'TypeScript' } },
								],
								error: null,
							}),
						}),
					};
				}
				// fallback to default mock
				return makeSupabaseMock(scenario).from(table);
			},
		},
	}));
	app = await buildApp();
});

const route = '/api/profile/skills';

describe('GET /api/profile/skills', () => {
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

	it('200: returns skills for valid user', async () => {
		mockJwtVerify.mockReturnValue({ sub: 'user-123' });
		const res = await request(app)
			.get(route)
			.set('Authorization', 'Bearer validtoken');
		expect(res.status).toBe(200);
		expect(res.body).toEqual([
			{ id: 2, name: 'Node.js' },
			{ id: 1, name: 'React' },
			{ id: 3, name: 'TypeScript' },
		]);
	});

	it('200: deduplicates and sorts skills by name', async () => {
		// Patch supabase mock for this test only
		vi.doMock('../src/lib/supabase', () => ({
			supabase: {
				from: (table: string) => {
					if (table === 'profile_skills') {
						return {
							select: () => ({
								eq: () => ({
									data: [
										{ skills: { id: 2, name: 'Node.js' } },
										{ skills: { id: 1, name: 'React' } },
										{ skills: { id: 3, name: 'TypeScript' } },
										{ skills: { id: 1, name: 'React' } }, // duplicate
										{ skills: { id: 2, name: 'Node.js' } }, // duplicate
									],
									error: null,
								}),
							}),
						};
					}
					return makeSupabaseMock(scenario).from(table);
				},
			},
		}));
		mockJwtVerify.mockReturnValue({ sub: 'user-123' });
		app = await buildApp();
		const res = await request(app)
			.get(route)
			.set('Authorization', 'Bearer validtoken');
		expect(res.status).toBe(200);
		// Sorted by name, deduped by id
		expect(res.body).toEqual([
			{ id: 2, name: 'Node.js' },
			{ id: 1, name: 'React' },
			{ id: 3, name: 'TypeScript' },
		]);
	});
});
