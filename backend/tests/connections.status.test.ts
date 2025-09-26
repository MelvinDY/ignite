import request from "supertest";
import { describe, it, expect, beforeEach, vi } from "vitest";

let app: ReturnType<Awaited<typeof import("../src/app")>["createApp"]>;

const mockJwtVerify = vi.fn();
vi.mock("jsonwebtoken", () => ({
	default: { verify: mockJwtVerify },
	verify: mockJwtVerify,
}));

type Scenario = {
	me: string;
	target: string;
	profiles: Set<string>;
	blocks: Array<{ blocker: string; blocked: string }>;
	connections: Array<{ a: string; b: string }>;
	pending: Array<{ sender: string; receiver: string }>;
};

let scenario: Scenario;

async function buildApp() {
	const mod = await import("../src/app");
	return mod.createApp();
}

beforeEach(async () => {
	vi.resetModules();

	scenario = {
		me: "me-1",
		target: "t-1",
		profiles: new Set(["me-1", "t-1"]),
		blocks: [],
		connections: [],
		pending: [],
	};

	// Supabase mock
	vi.doMock("../src/lib/supabase", () => {
		function from(table: string) {
			const state: any = {
				table,
				where: [] as Array<{ k: string; v: any }>,
				ors: [] as string[],
			};

			const api: any = {
				select: (_cols: string) => api,
				eq: (k: string, v: any) => {
					state.where.push({ k, v });
					return api;
				},
				or: (expr: string) => {
					state.ors.push(expr);
					return api;
				},
				async maybeSingle() {
					try {
						if (state.table === "profiles") {
							const id = state.where.find((w: any) => w.k === "id")?.v;
							if (id && scenario.profiles.has(id)) return { data: { id }, error: null };
							return { data: null, error: null };
						}

						if (state.table === "blocks") {
							const b = state.where.find((w: any) => w.k === "blocker_id")?.v;
							const d = state.where.find((w: any) => w.k === "blocked_id")?.v;
							const hit = scenario.blocks.find((x) => x.blocker === b && x.blocked === d);
							return { data: hit ? { blocker_id: b } : null, error: null };
						}

						if (state.table === "connections") {
							// parse or(...) for undirected pair
							const match = scenario.connections.find((c) => {
								return (
									(c.a === scenario.me && c.b === scenario.target) ||
									(c.a === scenario.target && c.b === scenario.me)
								);
							});
							return { data: match ? { user_id_a: match.a } : null, error: null };
						}

						if (state.table === "connection_requests") {
							const s = state.where.find((w: any) => w.k === "sender_id")?.v;
							const r = state.where.find((w: any) => w.k === "receiver_id")?.v;
							const st = state.where.find((w: any) => w.k === "status")?.v;
							if (st !== "pending") return { data: null, error: null };
							const hit = scenario.pending.find((x) => x.sender === s && x.receiver === r);
							return { data: hit ? { id: "req" } : null, error: null };
						}

						return { data: null, error: null };
					} catch (e: any) {
						return { data: null, error: e };
					}
				},
			};

			return api;
		}

		return { supabase: { from } as any };
	});

	// auth helper: token "ok" -> sub = scenario.me
	mockJwtVerify.mockImplementation((token: string) => {
		if (token !== "ok") throw new Error("bad token");
		return { sub: scenario.me };
	});

	app = await buildApp();
});

const ROUTE = "/api/connections/status";

describe("GET /connections/status (Story 4.8)", () => {
	it("401 when no auth", async () => {
		const res = await request(app).get(ROUTE).query({ withProfileId: "t-1" });
		expect(res.status).toBe(401);
		expect(res.body).toEqual({ code: "NOT_AUTHENTICATED" });
	});

	it("400 when missing query param", async () => {
		const res = await request(app).get(ROUTE).set("Authorization", "Bearer ok");
		expect(res.status).toBe(400);
		expect(res.body).toEqual({ code: "VALIDATION_ERROR" });
	});

	it("404 when target profile not found", async () => {
		scenario.profiles.delete("t-1");
		const res = await request(app)
			.get(ROUTE)
			.query({ withProfileId: "t-1" })
			.set("Authorization", "Bearer ok");
		expect(res.status).toBe(404);
		expect(res.body).toEqual({ code: "NOT_FOUND" });
	});

	it("200: blockedByMe disables everything else", async () => {
		scenario.blocks.push({ blocker: "me-1", blocked: "t-1" });
		const res = await request(app)
			.get(ROUTE)
			.query({ withProfileId: "t-1" })
			.set("Authorization", "Bearer ok");
		expect(res.status).toBe(200);
		expect(res.body).toEqual({
			connected: false,
			pendingOutgoing: false,
			pendingIncoming: false,
			blockedByMe: true,
			blockedMe: false,
			canSendRequest: false,
		});
	});

	it("200: connected overrides pending/canSend", async () => {
		scenario.connections.push({ a: "me-1", b: "t-1" });
		const res = await request(app)
			.get(ROUTE)
			.query({ withProfileId: "t-1" })
			.set("Authorization", "Bearer ok");
		expect(res.status).toBe(200);
		expect(res.body).toEqual({
			connected: true,
			pendingOutgoing: false,
			pendingIncoming: false,
			blockedByMe: false,
			blockedMe: false,
			canSendRequest: false,
		});
	});

	it("200: pending outgoing", async () => {
		scenario.pending.push({ sender: "me-1", receiver: "t-1" });
		const res = await request(app)
			.get(ROUTE)
			.query({ withProfileId: "t-1" })
			.set("Authorization", "Bearer ok");
		expect(res.status).toBe(200);
		expect(res.body).toEqual({
			connected: false,
			pendingOutgoing: true,
			pendingIncoming: false,
			blockedByMe: false,
			blockedMe: false,
			canSendRequest: false,
		});
	});

	it("200: pending incoming", async () => {
		scenario.pending.push({ sender: "t-1", receiver: "me-1" });
		const res = await request(app)
			.get(ROUTE)
			.query({ withProfileId: "t-1" })
			.set("Authorization", "Bearer ok");
		expect(res.status).toBe(200);
		expect(res.body).toEqual({
			connected: false,
			pendingOutgoing: false,
			pendingIncoming: true,
			blockedByMe: false,
			blockedMe: false,
			canSendRequest: false,
		});
	});

	it("200: canSendRequest true when none of the above and not self", async () => {
		const res = await request(app)
			.get(ROUTE)
			.query({ withProfileId: "t-1" })
			.set("Authorization", "Bearer ok");
		expect(res.status).toBe(200);
		expect(res.body).toEqual({
			connected: false,
			pendingOutgoing: false,
			pendingIncoming: false,
			blockedByMe: false,
			blockedMe: false,
			canSendRequest: true,
		});
	});

	it("200: self-query → canSendRequest false", async () => {
		const res = await request(app)
			.get(ROUTE)
			.query({ withProfileId: "me-1" })
			.set("Authorization", "Bearer ok");
		expect(res.status).toBe(200);
		expect(res.body).toEqual({
			connected: false,
			pendingOutgoing: false,
			pendingIncoming: false,
			blockedByMe: false,
			blockedMe: false,
			canSendRequest: false,
		});
	});
});
