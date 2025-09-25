import request from "supertest";
import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock JWT verification
const mockJwtVerify = vi.fn();
vi.mock("jsonwebtoken", () => ({
  default: {
    verify: mockJwtVerify,
  },
  verify: mockJwtVerify,
}));

// Connection request mock data
let mockConnectionRequest: any = null;
let mockUpdateError: any = null;

// Mock Supabase client  
const mockSupabase = {
  from: vi.fn((table: string) => {
    if (table === 'connection_requests') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: mockConnectionRequest,
              error: mockConnectionRequest ? null : { message: "Not found" }
            }))
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: null,
            error: mockUpdateError
          }))
        }))
      };
    }
    return {};
  })
};

vi.mock("../src/lib/supabase", () => ({
  supabase: mockSupabase
}));

let app: ReturnType<Awaited<typeof import("../src/app")>["createApp"]>;

async function buildApp() {
  const mod = await import("../src/app");
  return mod.createApp();
}

beforeEach(async () => {
  vi.resetAllMocks();
  await vi.resetModules();
  app = await buildApp();
});

const route = "/api/connections/requests/test-request-id/cancel";
const validToken = "Bearer validtoken";
const TEST_USER_ID = "test-user-123";
const TEST_REQUEST_ID = "test-request-id";

describe("POST /api/connections/requests/:id/cancel", () => {

  it("SUCCESS (200): Successfully cancels a pending request owned by the sender", async () => {
    // Mock JWT verification to return valid user
    mockJwtVerify.mockReturnValue({ sub: TEST_USER_ID });

    // Set up mock connection request data
    mockConnectionRequest = {
      id: TEST_REQUEST_ID,
      sender_id: TEST_USER_ID,
      status: "pending"
    };
    mockUpdateError = null;

    const res = await request(app)
      .post(route)
      .set("Authorization", validToken);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  it("SUCCESS (200): Returns success if request is already canceled (idempotent)", async () => {
    mockJwtVerify.mockReturnValue({ sub: TEST_USER_ID });

    // Set up mock connection request data for already canceled request
    mockConnectionRequest = {
      id: TEST_REQUEST_ID,
      sender_id: TEST_USER_ID,
      status: "canceled"
    };

    const res = await request(app)
      .post(route)
      .set("Authorization", validToken);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  it("ERROR (401): Returns NOT_AUTHENTICATED when no Authorization header", async () => {
    const res = await request(app).post(route);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ code: "NOT_AUTHENTICATED" });
  });

  it("ERROR (401): Returns NOT_AUTHENTICATED when invalid JWT token", async () => {
    mockJwtVerify.mockImplementation(() => {
      throw new Error("Invalid token");
    });

    const res = await request(app)
      .post(route)
      .set("Authorization", "Bearer invalidtoken");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ code: "NOT_AUTHENTICATED" });
  });

  it("ERROR (404): Returns NOT_FOUND when connection request doesn't exist", async () => {
    mockJwtVerify.mockReturnValue({ sub: TEST_USER_ID });

    // Set up mock - no connection request found
    mockConnectionRequest = null;

    const res = await request(app)
      .post(route)
      .set("Authorization", validToken);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ code: "NOT_FOUND" });
  });

  it("ERROR (404): Returns NOT_FOUND when user is not the sender of the request", async () => {
    mockJwtVerify.mockReturnValue({ sub: TEST_USER_ID });

    // Set up mock - request owned by different user
    mockConnectionRequest = {
      id: TEST_REQUEST_ID,
      sender_id: "different-user-id", // Different from TEST_USER_ID
      status: "pending"
    };

    const res = await request(app)
      .post(route)
      .set("Authorization", validToken);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ code: "NOT_FOUND" });
  });

  it("ERROR (409): Returns INVALID_STATE when request is already accepted", async () => {
    mockJwtVerify.mockReturnValue({ sub: TEST_USER_ID });

    // Set up mock - accepted request
    mockConnectionRequest = {
      id: TEST_REQUEST_ID,
      sender_id: TEST_USER_ID,
      status: "accepted"
    };

    const res = await request(app)
      .post(route)
      .set("Authorization", validToken);

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ code: "INVALID_STATE" });
  });

  it("ERROR (409): Returns INVALID_STATE when request is already declined", async () => {
    mockJwtVerify.mockReturnValue({ sub: TEST_USER_ID });

    // Set up mock - declined request
    mockConnectionRequest = {
      id: TEST_REQUEST_ID,
      sender_id: TEST_USER_ID,
      status: "declined"
    };

    const res = await request(app)
      .post(route)
      .set("Authorization", validToken);

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ code: "INVALID_STATE" });
  });

  it("ERROR (500): Returns INTERNAL when database update fails", async () => {
    mockJwtVerify.mockReturnValue({ sub: TEST_USER_ID });

    // Set up mock - valid pending request but update fails
    mockConnectionRequest = {
      id: TEST_REQUEST_ID,
      sender_id: TEST_USER_ID,
      status: "pending"
    };
    mockUpdateError = { message: "Database error" };

    const res = await request(app)
      .post(route)
      .set("Authorization", validToken);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ code: "INTERNAL" });
  });
});