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

// Mock data that can be modified in tests
let mockCountResult: { count: number | null; error: any } = { count: 0, error: null };
let mockConnectionsResult: { data: any[] | null; error: any } = { data: [], error: null };

// Mock Supabase client methods
const mockCountSelect = vi.fn();
const mockDataSelect = vi.fn();
const mockCountOr = vi.fn();
const mockDataOr = vi.fn();
const mockOrder = vi.fn();
const mockRange = vi.fn();

const mockSupabase = {
  from: vi.fn((table: string) => {
    if (table === "connections") {
      return {
        select: vi.fn((columns: string, options?: any) => {
          if (options?.count === "exact" && options?.head === true) {
            // This is the count query
            mockCountSelect(columns, options);
            return {
              or: mockCountOr.mockReturnValue(Promise.resolve(mockCountResult))
            };
          } else {
            // This is the data query
            mockDataSelect(columns, options);
            return {
              or: mockDataOr.mockReturnValue({
                order: mockOrder.mockReturnValue({
                  range: mockRange.mockReturnValue(Promise.resolve(mockConnectionsResult))
                })
              })
            };
          }
        })
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

describe("GET /connections", () => {
  const testUserId = "user-123";
  const validToken = "valid-jwt-token";

  beforeEach(async () => {
    vi.resetAllMocks();
    await vi.resetModules();

    // Reset mock data
    mockCountResult = { count: 0, error: null };
    mockConnectionsResult = { data: [], error: null };

    // Set up default mock behavior
    mockCountOr.mockResolvedValue(mockCountResult);
    mockRange.mockResolvedValue(mockConnectionsResult);
    mockOrder.mockReturnValue({ range: mockRange });
    mockDataOr.mockReturnValue({ order: mockOrder });

    app = await buildApp();
  });

  describe("Authentication", () => {
    it("should return 401 when no authorization header", async () => {
      const response = await request(app)
        .get("/api/connections");

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ code: "NOT_AUTHENTICATED" });
    });

    it("should return 401 when no bearer token", async () => {
      const response = await request(app)
        .get("/api/connections")
        .set("Authorization", "NotBearer invalid");

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ code: "NOT_AUTHENTICATED" });
    });

    it("should return 401 when invalid JWT token", async () => {
      const response = await request(app)
        .get("/api/connections")
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ code: "NOT_AUTHENTICATED" });
    });

    it("should return 401 when JWT has no sub claim", async () => {
      mockJwtVerify.mockReturnValue({ other: "claim" });

      const response = await request(app)
        .get("/api/connections")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ code: "NOT_AUTHENTICATED" });
    });
  });

  describe("Successful requests", () => {
    it("should return empty list when user has no connections", async () => {
      // Mock JWT verification to return valid user
      mockJwtVerify.mockReturnValue({ sub: testUserId });

      // Set up empty connections
      mockCountResult = { count: 0, error: null };
      mockConnectionsResult = { data: [], error: null };

      const response = await request(app)
        .get("/api/connections")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        results: [],
        pagination: {
          total: 0,
          page: 1,
          pageSize: 20,
          totalPages: 0
        }
      });

      // Verify count query was called
      expect(mockCountSelect).toHaveBeenCalledWith("*", { count: "exact", head: true });
    });

    it("should return connections with profile data", async () => {
      // Mock JWT verification to return valid user
      mockJwtVerify.mockReturnValue({ sub: testUserId });

      // Mock connections data
      mockCountResult = { count: 2, error: null };
      mockConnectionsResult = {
        data: [
          {
            connected_at: "2023-01-02T00:00:00Z",
            user_id_a: testUserId,
            user_id_b: "user-456",
            profile_a: {
              id: testUserId,
              full_name: "Test User",
              handle: "testuser",
              photo_url: "test.jpg",
              headline: "Test headline"
            },
            profile_b: {
              id: "user-456",
              full_name: "Alex Johnson",
              handle: "alex",
              photo_url: "alex.jpg",
              headline: "Software Engineer"
            }
          },
          {
            connected_at: "2023-01-01T00:00:00Z",
            user_id_a: "user-789",
            user_id_b: testUserId,
            profile_a: {
              id: "user-789",
              full_name: "Bob Smith",
              handle: "bob",
              photo_url: null,
              headline: "Product Manager"
            },
            profile_b: {
              id: testUserId,
              full_name: "Test User",
              handle: "testuser",
              photo_url: "test.jpg",
              headline: "Test headline"
            }
          }
        ], error: null
      };

      const response = await request(app)
        .get("/api/connections")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        results: [
          {
            profileId: "user-456",
            fullName: "Alex Johnson",
            handle: "alex",
            photoUrl: "alex.jpg",
            headline: "Software Engineer"
          },
          {
            profileId: "user-789",
            fullName: "Bob Smith",
            handle: "bob",
            photoUrl: null,
            headline: "Product Manager"
          }
        ],
        pagination: {
          total: 2,
          page: 1,
          pageSize: 20,
          totalPages: 1
        }
      });


    });

    it("should handle pagination parameters correctly", async () => {
      // Mock JWT verification to return valid user
      mockJwtVerify.mockReturnValue({ sub: testUserId });

      mockCountResult = { count: 25, error: null };
      mockConnectionsResult = { data: [], error: null }; // Empty for this test, we're just testing pagination logic

      const response = await request(app)
        .get("/api/connections?page=2&pageSize=10")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination).toEqual({
        total: 25,
        page: 2,
        pageSize: 10,
        totalPages: 3
      });

      // Verify range was called with correct offset
      expect(mockRange).toHaveBeenCalledWith(10, 19); // page 2, pageSize 10: offset 10, end 19
    });

    it("should handle invalid pagination parameters", async () => {
      // Mock JWT verification to return valid user
      mockJwtVerify.mockReturnValue({ sub: testUserId });

      mockCountResult = { count: 5, error: null };
      mockConnectionsResult = { data: [], error: null };

      const response = await request(app)
        .get("/api/connections?page=-1&pageSize=0")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination).toEqual({
        total: 5,
        page: 1, // parseInt("-1") = -1, Math.max(1, -1) = 1
        pageSize: 20, // parseInt("0") = 0, 0 || 20 = 20 (no validation needed)
        totalPages: 1 // Math.ceil(5 / 20) = 1
      });
    });

    it("should cap pageSize at maximum", async () => {
      // Mock JWT verification to return valid user
      mockJwtVerify.mockReturnValue({ sub: testUserId });

      mockCountResult = { count: 0, error: null };
      mockConnectionsResult = { data: [], error: null };

      const response = await request(app)
        .get("/api/connections?pageSize=200")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination.pageSize).toBe(100); // Should be capped at 100
    });

    it("should handle default pagination parameters", async () => {
      // Mock JWT verification to return valid user
      mockJwtVerify.mockReturnValue({ sub: testUserId });

      mockCountResult = { count: 0, error: null };
      mockConnectionsResult = { data: [], error: null };

      const response = await request(app)
        .get("/api/connections")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination).toEqual({
        total: 0,
        page: 1, // Default
        pageSize: 20, // Default
        totalPages: 0
      });
    });
  });

  describe("Database errors", () => {
    it("should return 500 when count query fails", async () => {
      // Mock JWT verification to return valid user
      mockJwtVerify.mockReturnValue({ sub: testUserId });

      mockCountResult = { count: null, error: { message: "Database connection failed", code: "DB_ERROR" } };

      const response = await request(app)
        .get("/api/connections")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ code: "INTERNAL" });
    });

    it("should return 500 when connections query fails", async () => {
      // Mock JWT verification to return valid user
      mockJwtVerify.mockReturnValue({ sub: testUserId });

      mockCountResult = { count: 10, error: null };
      mockConnectionsResult = { data: null, error: { message: "Database connection failed", code: "DB_ERROR" } };

      const response = await request(app)
        .get("/api/connections")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ code: "INTERNAL" });
    });

    it("should return 500 when database throws exception", async () => {
      // Mock JWT verification to return valid user
      mockJwtVerify.mockReturnValue({ sub: testUserId });

      // Make the Supabase from function throw an exception
      mockSupabase.from.mockImplementation(() => {
        throw new Error("Database connection failed");
      });

      const response = await request(app)
        .get("/api/connections")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ code: "INTERNAL" });
    });
  });
});