import request from "supertest";
import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import {
  makeLoginSupabaseMock,
  mockMaybeSingle,
} from "./utils/loginSupabaseMock";

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
const credentials = {
  email: "active.user@example.com",
  password: "password123",
};

describe("POST /api/auth/login", () => {
  it("SUCCESS (200): Given valid credentials for an ACTIVE user, returns tokens", async () => {
    mockGenerateAccessToken.mockReturnValue("fake_access_token");
    mockGenerateRefreshToken.mockReturnValue("fake_refresh_token");
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: "user-123",
        status: "ACTIVE",
        user: { encrypted_password: "hashed_password" },
      },
      error: null,
      count: 1,
      status: 200,
      statusText: "OK",
    });
    app = await buildApp();

    const res = await request(app).post(route).send(credentials).expect(200);

    expect(res.body.accessToken).toBe("fake_access_token");
    expect(res.headers["set-cookie"][0]).toContain(
      "refreshToken=fake_refresh_token",
    );
  });

  it("FAILURE (401): Given an incorrect password, returns an error", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: "user-123",
        status: "ACTIVE",
        user: { encrypted_password: "a_different_hash" },
      },
      error: null,
      count: 1,
      status: 200,
      statusText: "OK",
    });
    app = await buildApp();

    await request(app).post(route).send(credentials).expect(401);
  });

  it("FAILURE (403): Given a user who is PENDING_VERIFICATION, returns an error", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: "user-456",
        status: "PENDING_VERIFICATION",
        user: { encrypted_password: "hashed_password" },
      },
      error: null,
      count: 1,
      status: 200,
      statusText: "OK",
    });
    app = await buildApp();

    await request(app).post(route).send(credentials).expect(403);
  });
});
