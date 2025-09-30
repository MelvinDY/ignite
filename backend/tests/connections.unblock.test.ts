// tests/unblock.service.test.ts
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
const mockUnblockUser = vi.fn();

vi.mock("../src/services/block.service", () => ({
  unblockUser: mockUnblockUser,
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
const validBearer = "Bearer validtoken";

// Use *real UUIDs* so zod .uuid() passes
const TEST_USER_ID = "8d3c2a58-1a1e-4c2f-9d8f-0b8a3e3a12ab";
const TARGET_USER_ID = "3f5b0882-2cbb-4a6a-af7c-6a1cb1a32e77";

/** =======================================================================
 *  DELETE /users/:profileId/block
 *  ======================================================================= */
describe("DELETE /api/users/:profileId/block", () => {
  const route = `/api/users/${TARGET_USER_ID}/block`;

  it("200: successfully unblocks a user", async () => {
    mockJwtVerify.mockReturnValue({ sub: TEST_USER_ID });
    mockUnblockUser.mockResolvedValue(undefined);

    const res = await request(app)
      .delete(route)
      .set("Authorization", validBearer)
      .send();

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(mockUnblockUser).toHaveBeenCalledWith(TEST_USER_ID, TARGET_USER_ID);
  });

  it("200: idempotent - unblocking non-blocked user should succeed", async () => {
    mockJwtVerify.mockReturnValue({ sub: TEST_USER_ID });
    mockUnblockUser.mockResolvedValue(undefined);

    const res = await request(app)
      .delete(route)
      .set("Authorization", validBearer)
      .send();

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  it("401 NOT_AUTHENTICATED: missing Authorization header", async () => {
    const res = await request(app)
      .delete(route)
      .send();

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ code: "NOT_AUTHENTICATED" });
  });

  it("401 NOT_AUTHENTICATED: invalid token", async () => {
    mockJwtVerify.mockImplementation(() => {
      throw new Error("Invalid token");
    });

    const res = await request(app)
      .delete(route)
      .set("Authorization", "Bearer invalid-token")
      .send();

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ code: "NOT_AUTHENTICATED" });
  });
});