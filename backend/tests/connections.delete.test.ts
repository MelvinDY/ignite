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

// Mock data
let mockDeleteResult: any = { data: [], error: null };

// Mock the delete chain
const mockSelect = vi.fn();
const mockOr = vi.fn(() => ({ select: mockSelect }));
const mockDelete = vi.fn(() => ({ or: mockOr }));
const mockFrom = vi.fn(() => ({ delete: mockDelete }));

const mockSupabase = { from: mockFrom };

vi.mock("../src/lib/supabase", () => ({
  supabase: mockSupabase
}));

let app: ReturnType<Awaited<typeof import("../src/app")>["createApp"]>;

async function buildApp() {
  const mod = await import("../src/app");
  return mod.createApp();
}

describe("DELETE /connections/:profileId", () => {
  const testUserId = "user-123";
  const testProfileId = "profile-456";
  const validToken = "valid-jwt-token";

  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset mock result
    mockDeleteResult = { data: [], error: null };

    // Setup the mock chain
    mockSelect.mockResolvedValue(mockDeleteResult);
    mockOr.mockReturnValue({ select: mockSelect });
    mockDelete.mockReturnValue({ or: mockOr });
    mockFrom.mockReturnValue({ delete: mockDelete });

    // Mock JWT verification to return test user
    mockJwtVerify.mockImplementation((token: string) => {
      if (token === validToken) {
        return { sub: testUserId };
      }
      throw new Error("Invalid token");
    });

    // Build app
    app = await buildApp();
  });

  describe("Authentication", () => {
    it("should return 401 when no authorization header", async () => {
      const response = await request(app)
        .delete(`/api/connections/${testProfileId}`);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ code: "NOT_AUTHENTICATED" });
    });

    it("should return 401 when no bearer token", async () => {
      const response = await request(app)
        .delete(`/api/connections/${testProfileId}`)
        .set("Authorization", "NotBearer invalid");

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ code: "NOT_AUTHENTICATED" });
    });

    it("should return 401 when invalid JWT token", async () => {
      const response = await request(app)
        .delete(`/api/connections/${testProfileId}`)
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ code: "NOT_AUTHENTICATED" });
    });

    it("should return 401 when JWT has no sub claim", async () => {
      mockJwtVerify.mockReturnValue({ other: "claim" });

      const response = await request(app)
        .delete(`/api/connections/${testProfileId}`)
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ code: "NOT_AUTHENTICATED" });
    });
  });

  describe("Successful deletion", () => {
    it("should delete existing connection and return success", async () => {
      // Mock successful deletion (connection existed)
      mockDeleteResult = {
        data: [{ user_id_a: testUserId, user_id_b: testProfileId }],
        error: null,
      };
      mockSelect.mockResolvedValue(mockDeleteResult);

      const response = await request(app)
        .delete(`/api/connections/${testProfileId}`)
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });

      // Verify the delete query was called correctly
      expect(mockFrom).toHaveBeenCalledWith("connections");
      expect(mockDelete).toHaveBeenCalled();
      expect(mockOr).toHaveBeenCalledWith(
        `and(user_id_a.eq.${testUserId},user_id_b.eq.${testProfileId}),and(user_id_a.eq.${testProfileId},user_id_b.eq.${testUserId})`
      );
      expect(mockSelect).toHaveBeenCalled();
    });

    it("should handle idempotent deletion (no existing connection)", async () => {
      // Mock deletion where no connection existed
      mockDeleteResult = {
        data: [],
        error: null,
      };
      mockSelect.mockResolvedValue(mockDeleteResult);

      const response = await request(app)
        .delete(`/api/connections/${testProfileId}`)
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });

      // Verify the delete query was still called
      expect(mockFrom).toHaveBeenCalledWith("connections");
      expect(mockDelete).toHaveBeenCalled();
      expect(mockOr).toHaveBeenCalledWith(
        `and(user_id_a.eq.${testUserId},user_id_b.eq.${testProfileId}),and(user_id_a.eq.${testProfileId},user_id_b.eq.${testUserId})`
      );
    });

    it("should handle deletion with different user ID ordering", async () => {
      const differentProfileId = "profile-789";

      // Mock successful deletion
      mockDeleteResult = {
        data: [{ user_id_a: differentProfileId, user_id_b: testUserId }],
        error: null,
      };
      mockSelect.mockResolvedValue(mockDeleteResult);

      const response = await request(app)
        .delete(`/api/connections/${differentProfileId}`)
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });

      // Verify both orderings are checked
      expect(mockOr).toHaveBeenCalledWith(
        `and(user_id_a.eq.${testUserId},user_id_b.eq.${differentProfileId}),and(user_id_a.eq.${differentProfileId},user_id_b.eq.${testUserId})`
      );
    });
  });

  describe("Database errors", () => {
    it("should return 500 when database deletion fails", async () => {
      // Mock database error
      mockDeleteResult = {
        data: null,
        error: { message: "Database connection failed", code: "DB_ERROR" },
      };
      mockSelect.mockResolvedValue(mockDeleteResult);

      const response = await request(app)
        .delete(`/api/connections/${testProfileId}`)
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ code: "INTERNAL" });
    });

    it("should return 500 when database throws exception", async () => {
      // Mock database exception
      mockSelect.mockRejectedValue(new Error("Connection timeout"));

      const response = await request(app)
        .delete(`/api/connections/${testProfileId}`)
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ code: "INTERNAL" });
    });
  });

  describe("Parameter validation", () => {
    it("should handle missing profileId parameter", async () => {
      const response = await request(app)
        .delete("/api/connections/")
        .set("Authorization", `Bearer ${validToken}`);

      // This should result in a 404 as the route won't match
      expect(response.status).toBe(404);
    });

    it("should handle UUID format for profileId", async () => {
      // The route accepts any string as profileId - UUID validation 
      // would typically be done in a middleware or the service layer
      mockDeleteResult = {
        data: [],
        error: null,
      };
      mockSelect.mockResolvedValue(mockDeleteResult);

      const response = await request(app)
        .delete("/api/connections/not-a-uuid")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
    });
  });

  describe("Edge cases", () => {
    it("should handle self-connection attempt", async () => {
      // User tries to disconnect from themselves
      mockDeleteResult = {
        data: [],
        error: null,
      };
      mockSelect.mockResolvedValue(mockDeleteResult);

      const response = await request(app)
        .delete(`/api/connections/${testUserId}`)
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });

      // The query should still be attempted (but no connection should exist due to DB constraint)
      expect(mockOr).toHaveBeenCalledWith(
        `and(user_id_a.eq.${testUserId},user_id_b.eq.${testUserId}),and(user_id_a.eq.${testUserId},user_id_b.eq.${testUserId})`
      );
    });

    it("should handle empty profileId", async () => {
      const response = await request(app)
        .delete("/api/connections/ ")  // URL with space doesn't match route pattern
        .set("Authorization", `Bearer ${validToken}`);

      // This should result in a 404 as the route won't match with a space
      expect(response.status).toBe(404);
    });
  });
});