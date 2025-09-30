// tests/block.service.test.ts
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

/** -------- Service mock -------- */
const mockBlockUser = vi.fn();

// IMPORTANT: path must match how the router imports it
vi.mock("../src/services/block.service", () => ({
  blockUser: mockBlockUser,
}));

/** -------- App bootstrapping -------- */
let app: ReturnType<Awaited<typeof import("../src/app")>["createApp"]>;

async function buildApp() {
  const mod = await import("../src/app");
  return mod.createApp();
}

// IMPORTANT: resetModules so the app re-imports with our mocks wired
beforeEach(async () => {
  vi.clearAllMocks();
  await vi.resetModules();
  app = await buildApp();
});

/** -------- Test constants -------- */
const validBearer = "Bearer validtoken";

// Use *real UUIDs* so zod .uuid() passes
const TEST_USER_ID = "8d3c2a58-1a1e-4c2f-9d8f-0b8a3e3a12ab";
const TARGET_USER_ID = "3f5b0882-2cbb-4a6a-af7c-6a1cb1a32e77";

/** =======================================================================
 *  POST /users/:profileId/block
 *  ======================================================================= */
describe("POST /api/users/:profileId/block", () => {
  const route = `/api/users/${TARGET_USER_ID}/block`;

  it("200: successfully blocks a user", async () => {
    mockJwtVerify.mockReturnValue({ sub: TEST_USER_ID });
    mockBlockUser.mockResolvedValue(undefined);

    const res = await request(app)
      .post(route)
      .set("Authorization", validBearer)
      .send();

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(mockBlockUser).toHaveBeenCalledWith(TEST_USER_ID, TARGET_USER_ID);
  });

  it("200: idempotent - blocking same user twice should succeed", async () => {
    mockJwtVerify.mockReturnValue({ sub: TEST_USER_ID });
    mockBlockUser.mockResolvedValue(undefined);

    const res = await request(app)
      .post(route)
      .set("Authorization", validBearer)
      .send();

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  it("401 NOT_AUTHENTICATED: missing Authorization header", async () => {
    const res = await request(app)
      .post(route)
      .send();

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ code: "NOT_AUTHENTICATED" });
  });

  it("401 NOT_AUTHENTICATED: invalid token", async () => {
    mockJwtVerify.mockImplementation(() => {
      throw new Error("Invalid token");
    });

    const res = await request(app)
      .post(route)
      .set("Authorization", "Bearer invalid-token")
      .send();

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ code: "NOT_AUTHENTICATED" });
  });

  it("400 VALIDATION_ERROR: Block self", async () => {
    const selfRoute = `/api/users/${TEST_USER_ID}/block`;
    mockJwtVerify.mockReturnValue({ sub: TEST_USER_ID });
    mockBlockUser.mockRejectedValue({ code: "VALIDATION_ERROR" });

    const res = await request(app)
      .post(selfRoute)
      .set("Authorization", validBearer)
      .send();

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ code: "VALIDATION_ERROR" });
    expect(mockBlockUser).toHaveBeenCalledWith(TEST_USER_ID, TEST_USER_ID);
  });

  it("404 NOT_FOUND: target user not found", async () => {
    mockJwtVerify.mockReturnValue({ sub: TEST_USER_ID });
    mockBlockUser.mockRejectedValue({ code: "NOT_FOUND" });

    const res = await request(app)
      .post(route)
      .set("Authorization", validBearer)
      .send();

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ code: "NOT_FOUND" });
  });
});
