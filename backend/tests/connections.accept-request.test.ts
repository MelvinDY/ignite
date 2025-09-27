// tests/connections.accept-request.test.ts
import request from "supertest";
import { describe, it, expect, beforeEach, vi } from "vitest";

/** -------- JWT mock -------- */
const mockJwtVerify = vi.fn();
vi.mock("jsonwebtoken", () => ({
  default: { verify: mockJwtVerify },
  verify: mockJwtVerify,
}));

/** -------- Supabase mock (generic no-op) -------- */
const noopPromise = Promise.resolve({ data: null, error: null });
const qb = {
  select: vi.fn(() => qb),
  insert: vi.fn(() => qb),
  update: vi.fn(() => qb),
  upsert: vi.fn(() => qb),
  delete: vi.fn(() => qb),
  rpc: vi.fn(() => noopPromise),
  eq: vi.fn(() => qb),
  or: vi.fn(() => qb),
  in: vi.fn(() => qb),
  order: vi.fn(() => qb),
  limit: vi.fn(() => qb),
  single: vi.fn(() => Promise.resolve({ data: null, error: null })),
  maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
};
const mockSupabase = {
  from: vi.fn(() => qb),
  rpc: vi.fn(() => noopPromise),
};

vi.mock("../src/lib/supabase", () => ({
  supabase: mockSupabase,
}));

/** -------- Service mock (ensure instanceof matches) -------- */
const mockAcceptConnectionRequest = vi.fn();

class MockConnectionRequestError extends Error {
  code:
    | "NOT_FOUND"
    | "INVALID_STATE"
    | "UNAUTHORIZED"
    | "ALREADY_CONNECTED"
    | "REQUEST_ALREADY_EXISTS"
    | "BLOCKED"
    | "TOO_MANY_REQUESTS";
  statusCode: number;

  constructor(
    code: MockConnectionRequestError["code"],
    statusCode: number,
    message?: string
  ) {
    super(message ?? code);
    this.name = "ConnectionRequestError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

// Match the type used in the router
vi.mock("../src/types/ConnectionRequest", () => ({
  ConnectionRequestError: MockConnectionRequestError,
}));

// IMPORTANT: path must match how the router imports it
vi.mock("../src/services/connections.service", () => ({
  acceptConnectionRequest: mockAcceptConnectionRequest,
  ConnectionRequestError: MockConnectionRequestError,
}));

/** -------- App bootstrapping -------- */
let app: ReturnType<Awaited<typeof import("../src/app")>["createApp"]>;

async function buildApp() {
  const mod = await import("../src/app");
  return mod.createApp();
}

beforeEach(async () => {
  vi.clearAllMocks();
  await vi.resetModules();
  app = await buildApp();
});

/** -------- Test constants -------- */
const BASE = "/api/connections/requests";
const validBearer = "Bearer validtoken";

// use real UUIDs to keep any zod/uuid checks happy (even though accept route only checks presence)
const TEST_PROFILE_ID = "8d3c2a58-1a1e-4c2f-9d8f-0b8a3e3a12ab";
const REQUEST_ID      = "3f5b0882-2cbb-4a6a-af7c-6a1cb1a32e77";

/** =======================================================================
 *  POST /connections/requests/:id/accept
 *  ======================================================================= */
describe("POST /api/connections/requests/:id/accept", () => {
  it("200: accepts a pending request (happy path)", async () => {
    mockJwtVerify.mockReturnValue({ sub: TEST_PROFILE_ID });
    mockAcceptConnectionRequest.mockResolvedValue({ success: true });

    const res = await request(app)
      .post(`${BASE}/${REQUEST_ID}/accept`)
      .set("Authorization", validBearer);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(mockAcceptConnectionRequest).toHaveBeenCalledWith(
      REQUEST_ID,
      TEST_PROFILE_ID
    );
  });

  it("401: missing Authorization header", async () => {
    const res = await request(app).post(`${BASE}/${REQUEST_ID}/accept`);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ code: "NOT_AUTHENTICATED" });
    expect(mockAcceptConnectionRequest).not.toHaveBeenCalled();
  });

  it("401: invalid JWT", async () => {
    mockJwtVerify.mockImplementation(() => {
      throw new Error("bad token");
    });

    const res = await request(app)
      .post(`${BASE}/${REQUEST_ID}/accept`)
      .set("Authorization", "Bearer bad");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ code: "NOT_AUTHENTICATED" });
    expect(mockAcceptConnectionRequest).not.toHaveBeenCalled();
  });

  it("404: request not found or not addressed to caller", async () => {
    mockJwtVerify.mockReturnValue({ sub: TEST_PROFILE_ID });
    mockAcceptConnectionRequest.mockRejectedValue(
      new MockConnectionRequestError("NOT_FOUND", 404)
    );

    const res = await request(app)
      .post(`${BASE}/${REQUEST_ID}/accept`)
      .set("Authorization", validBearer);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ code: "NOT_FOUND" });
  });

  it("409: invalid state (e.g., not pending)", async () => {
    mockJwtVerify.mockReturnValue({ sub: TEST_PROFILE_ID });
    mockAcceptConnectionRequest.mockRejectedValue(
      new MockConnectionRequestError("INVALID_STATE", 409)
    );

    const res = await request(app)
      .post(`${BASE}/${REQUEST_ID}/accept`)
      .set("Authorization", validBearer);

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ code: "INVALID_STATE" });
  });

  it("500: unexpected error bubbles to INTERNAL", async () => {
    mockJwtVerify.mockReturnValue({ sub: TEST_PROFILE_ID });
    mockAcceptConnectionRequest.mockRejectedValue(new Error("db blew up"));

    const res = await request(app)
      .post(`${BASE}/${REQUEST_ID}/accept`)
      .set("Authorization", validBearer);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ code: "INTERNAL" });
  });
});
