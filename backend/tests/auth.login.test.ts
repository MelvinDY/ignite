import request from "supertest";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { makeLoginSupabaseMock, mockMaybeSingle } from "./utils/loginSupabaseMock";

vi.mock("jsonwebtoken");

const mockGenerateAccessToken = vi.fn();
const mockGenerateRefreshToken = vi.fn();
vi.doMock("../src/utils/tokens", async (importOriginal) => {
  const original = await importOriginal<typeof import("../src/utils/tokens")>();
  return {
    ...original,
    generateAccessToken: mockGenerateAccessToken,
    generateRefreshToken: mockGenerateRefreshToken,
  };
});

let app: ReturnType<Awaited<typeof import("../src/app")>["createApp"]>;

async function buildApp() {
  const mod = await import("../src/app");
  return mod.createApp();
}

beforeEach(async () => {
  vi.resetAllMocks();
  await vi.resetModules();
  vi.doMock("../src/lib/supabase", () => ({
    supabase: makeLoginSupabaseMock(),
  }));
  app = await buildApp();
});

const route = "/api/auth/login";
const credentials = { email: "active.user@example.com", password: "password123" };

describe("POST /api/auth/login", () => {
  it("SUCCESS (200): ACTIVE user returns accessToken and sets refresh cookie", async () => {
    mockGenerateAccessToken.mockReturnValue("fake_access_token");
    mockGenerateRefreshToken.mockReturnValue("fake_refresh_token");
    mockMaybeSingle.mockResolvedValue({
      data: { id: "user-123", status: "ACTIVE", user: { encrypted_password: "hashed_password" } },
      error: null,
      count: 1,
      status: 200,
      statusText: "OK",
    });

    const res = await request(app).post(route).send(credentials).expect(200);

    expect(res.body).toMatchObject({ success: true, userId: "user-123", accessToken: "fake_access_token", expiresIn: 900 });
    const setCookie = res.headers["set-cookie"][0];
    expect(setCookie).toContain("refreshToken=fake_refresh_token");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Lax");
    expect(setCookie).toContain("Path=/");
  });

  it("FAILURE (401): Incorrect password returns INVALID_CREDENTIALS", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { id: "user-123", status: "ACTIVE", user: { encrypted_password: "a_different_hash" } },
      error: null,
      count: 1,
      status: 200,
      statusText: "OK",
    });
    await request(app).post(route).send(credentials).expect(401);
  });

  it("FAILURE (403): PENDING_VERIFICATION returns ACCOUNT_NOT_VERIFIED", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { id: "user-456", status: "PENDING_VERIFICATION", user: { encrypted_password: "hashed_password" } },
      error: null,
      count: 1,
      status: 200,
      statusText: "OK",
    });
    await request(app).post(route).send(credentials).expect(403);
  });
});
