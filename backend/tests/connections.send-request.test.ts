// tests/connections.send-request.test.ts
import request from "supertest";
import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";

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

/** -------- Service mock (match instanceof in the route) -------- */
const mockSendConnectionRequest = vi.fn();

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

// IMPORTANT: path must match how the router imports it
vi.mock("../src/services/connections.service", () => ({
  sendConnectionRequest: mockSendConnectionRequest,
  ConnectionRequestError: MockConnectionRequestError,
}));

/** -------- App bootstrapping -------- */
let app: ReturnType<Awaited<typeof import("../src/app")>["createApp"]>;

beforeAll(async () => {
  const mod = await import("../src/app");
  app = mod.createApp();
});

beforeEach(() => {
  vi.clearAllMocks(); // keep mocks, just reset call counts/behaviors
});

/** -------- Test constants -------- */
const route = "/api/connections/requests";
const validBearer = "Bearer validtoken";

// Use *real UUIDs* so zod .uuid() passes
const TEST_USER_ID = "8d3c2a58-1a1e-4c2f-9d8f-0b8a3e3a12ab";
const RECEIVER_ID  = "3f5b0882-2cbb-4a6a-af7c-6a1cb1a32e77";

/** =======================================================================
 *  POST /connections/requests
 *  ======================================================================= */
describe("POST /api/connections/requests", () => {
  it("201: creates a pending request (happy path)", async () => {
    mockJwtVerify.mockReturnValue({ sub: TEST_USER_ID });
    mockSendConnectionRequest.mockResolvedValue({ requestId: "req-123" });

    const res = await request(app)
      .post(route)
      .set("Authorization", validBearer)
      .send({ toProfileId: RECEIVER_ID, message: "hey, let's connect!" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      success: true,
      requestId: "req-123",
      status: "pending",
    });
    expect(mockSendConnectionRequest).toHaveBeenCalledWith({
      senderId: TEST_USER_ID,
      receiverId: RECEIVER_ID,
      message: "hey, let's connect!",
    });
  });

  it("201: message is optional and defaults to null", async () => {
    mockJwtVerify.mockReturnValue({ sub: TEST_USER_ID });
    mockSendConnectionRequest.mockResolvedValue({ requestId: "req-xyz" });

    const res = await request(app)
      .post(route)
      .set("Authorization", validBearer)
      .send({ toProfileId: RECEIVER_ID });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      success: true,
      requestId: "req-xyz",
      status: "pending",
    });
    expect(mockSendConnectionRequest).toHaveBeenCalledWith({
      senderId: TEST_USER_ID,
      receiverId: RECEIVER_ID,
      message: null,
    });
  });

  it("401: missing Authorization header", async () => {
    const res = await request(app).post(route).send({ toProfileId: RECEIVER_ID });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ code: "NOT_AUTHENTICATED" });
  });

  it("401: invalid JWT", async () => {
    mockJwtVerify.mockImplementation(() => {
      throw new Error("bad token");
    });

    const res = await request(app)
      .post(route)
      .set("Authorization", "Bearer bad")
      .send({ toProfileId: RECEIVER_ID });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ code: "NOT_AUTHENTICATED" });
  });

  it("400: validation error - missing toProfileId", async () => {
    mockJwtVerify.mockReturnValue({ sub: TEST_USER_ID });

    const res = await request(app)
      .post(route)
      .set("Authorization", validBearer)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("400: validation error - invalid UUID", async () => {
    mockJwtVerify.mockReturnValue({ sub: TEST_USER_ID });

    const res = await request(app)
      .post(route)
      .set("Authorization", validBearer)
      .send({ toProfileId: "not-a-uuid" });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("400: validation error - message too long (301 chars)", async () => {
    mockJwtVerify.mockReturnValue({ sub: TEST_USER_ID });

    const res = await request(app)
      .post(route)
      .set("Authorization", validBearer)
      .send({ toProfileId: RECEIVER_ID, message: "a".repeat(301) });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("403: BLOCKED (either direction)", async () => {
    mockJwtVerify.mockReturnValue({ sub: TEST_USER_ID });
    mockSendConnectionRequest.mockRejectedValue(
      new MockConnectionRequestError("BLOCKED", 403)
    );

    const res = await request(app)
      .post(route)
      .set("Authorization", validBearer)
      .send({ toProfileId: RECEIVER_ID });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ code: "BLOCKED" });
  });

  it("404: receiver profile not found", async () => {
    mockJwtVerify.mockReturnValue({ sub: TEST_USER_ID });
    mockSendConnectionRequest.mockRejectedValue(
      new MockConnectionRequestError("NOT_FOUND", 404)
    );

    const res = await request(app)
      .post(route)
      .set("Authorization", validBearer)
      .send({ toProfileId: RECEIVER_ID });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ code: "NOT_FOUND" });
  });

  it("409: ALREADY_CONNECTED", async () => {
    mockJwtVerify.mockReturnValue({ sub: TEST_USER_ID });
    mockSendConnectionRequest.mockRejectedValue(
      new MockConnectionRequestError("ALREADY_CONNECTED", 409)
    );

    const res = await request(app)
      .post(route)
      .set("Authorization", validBearer)
      .send({ toProfileId: RECEIVER_ID });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ code: "ALREADY_CONNECTED" });
  });

  it("409: REQUEST_ALREADY_EXISTS (pending either direction or cooldown)", async () => {
    mockJwtVerify.mockReturnValue({ sub: TEST_USER_ID });
    mockSendConnectionRequest.mockRejectedValue(
      new MockConnectionRequestError("REQUEST_ALREADY_EXISTS", 409)
    );

    const res = await request(app)
      .post(route)
      .set("Authorization", validBearer)
      .send({ toProfileId: RECEIVER_ID });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ code: "REQUEST_ALREADY_EXISTS" });
  });

  it("409: INVALID_STATE (e.g., self-send)", async () => {
    mockJwtVerify.mockReturnValue({ sub: TEST_USER_ID });
    mockSendConnectionRequest.mockRejectedValue(
      new MockConnectionRequestError("INVALID_STATE", 409)
    );

    const res = await request(app)
      .post(route)
      .set("Authorization", validBearer)
      .send({ toProfileId: RECEIVER_ID });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ code: "INVALID_STATE" });
  });

  it("429: TOO_MANY_REQUESTS (daily cap)", async () => {
    mockJwtVerify.mockReturnValue({ sub: TEST_USER_ID });
    mockSendConnectionRequest.mockRejectedValue(
      new MockConnectionRequestError("TOO_MANY_REQUESTS", 429)
    );

    const res = await request(app)
      .post(route)
      .set("Authorization", validBearer)
      .send({ toProfileId: RECEIVER_ID });

    expect(res.status).toBe(429);
    expect(res.body).toEqual({ code: "TOO_MANY_REQUESTS" });
  });

  it("500: unexpected error bubbles to INTERNAL", async () => {
    mockJwtVerify.mockReturnValue({ sub: TEST_USER_ID });
    mockSendConnectionRequest.mockRejectedValue(new Error("db blew up"));

    const res = await request(app)
      .post(route)
      .set("Authorization", validBearer)
      .send({ toProfileId: RECEIVER_ID });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ code: "INTERNAL" });
  });
});
