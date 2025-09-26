import request from "supertest";
import { describe, it, expect, beforeEach, vi } from "vitest";

const mockJwtVerify = vi.fn();

vi.mock("jsonwebtoken", () => ({
  default: {
    verify: mockJwtVerify,
  },
  verify: mockJwtVerify,
}));

// Mock data
let mockConnectionRequestsData: any[] = [];
let mockTotalCount: number = 0;
let mockCountError: any = null;
let mockSelectError: any = null;

// Mock Supabase client (chainable, supports multiple .eq)
const mockSupabase = {
  from: vi.fn((table: string) => {
    if (table !== "connection_requests") return {};

    return {
      select: vi.fn((_query: string, options?: any) => {
        // HEAD = true branch (count)
        if (options?.head === true) {
          // Thenable builder so `await ...select(...).eq(...).eq(...)` works
          const b: any = {};
          b.eq = vi.fn(() => b); // allow multiple eq chains
          b.then = (resolve: any) =>
            resolve({ count: mockTotalCount, error: mockCountError });
          return b;
        }

        // Data branch
        const b: any = {};
        b.eq = vi.fn(() => b);                     // allow .eq().eq()
        b.range = vi.fn(() => b);                  // allow .range()
        b.order = vi.fn(() =>                      // final awaited call
          Promise.resolve({
            data: mockConnectionRequestsData,
            error: mockSelectError,
          })
        );
        return b;
      }),
    };
  }),
};


vi.mock("../src/lib/supabase", () => ({
  supabase: mockSupabase,
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

  // Reset mock data
  mockConnectionRequestsData = [];
  mockTotalCount = 0;
  mockCountError = null;
  mockSelectError = null;
});

const route = "/api/connections/requests";
const validToken = "Bearer validtoken";
const TEST_USER_ID = "test-user-123";

describe("GET /api/connections/requests", () => {
  describe("Authentication", () => {
    it("ERROR (401): Returns NOT_AUTHENTICATED when no Authorization header", async () => {
      const res = await request(app).get(route);

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ code: "NOT_AUTHENTICATED" });
    });

    it("ERROR (401): Returns NOT_AUTHENTICATED when invalid JWT token", async () => {
      mockJwtVerify.mockImplementation(() => {
        throw new Error("Invalid token");
      });

      const res = await request(app)
        .get(route)
        .set("Authorization", "Bearer invalidtoken");

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ code: "NOT_AUTHENTICATED" });
    });

    it("ERROR (401): Returns NOT_AUTHENTICATED when token has no userId", async () => {
      mockJwtVerify.mockReturnValue({ sub: null });

      const res = await request(app)
        .get(route)
        .set("Authorization", validToken);

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ code: "NOT_AUTHENTICATED" });
    });
  });

  describe("Query Parameter Validation", () => {
    beforeEach(() => {
      mockJwtVerify.mockReturnValue({ sub: TEST_USER_ID });
    });

    it("SUCCESS (200): Accepts valid type parameters", async () => {
      mockTotalCount = 0;
      mockConnectionRequestsData = [];

      const incomingRes = await request(app)
        .get(route)
        .query({ type: "incoming" })
        .set("Authorization", validToken);

      expect(incomingRes.status).toBe(200);

      const outgoingRes = await request(app)
        .get(route)
        .query({ type: "outgoing" })
        .set("Authorization", validToken);

      expect(outgoingRes.status).toBe(200);
    });
  });

  describe("Incoming Connection Requests", () => {
    beforeEach(() => {
      mockJwtVerify.mockReturnValue({ sub: TEST_USER_ID });
    });

    it("SUCCESS (200): Returns empty list when no incoming requests", async () => {
      mockTotalCount = 0;
      mockConnectionRequestsData = [];

      const res = await request(app)
        .get(route)
        .query({ type: "incoming" })
        .set("Authorization", validToken);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        results: [],
        pagination: {
          total: 0,
          page: 1,
          pageSize: 20,
          totalPages: 0,
        },
      });
    });

    it("SUCCESS (200): Returns incoming connection requests with proper structure", async () => {
      mockTotalCount = 2;
      mockConnectionRequestsData = [
        {
          id: "request-1",
          sender_id: "sender-1",
          receiver_id: TEST_USER_ID,
          created_at: "2024-01-15T10:00:00Z",
          sender: [
            {
              full_name: "John Doe",
              handle: "johndoe",
              photo_url: "https://example.com/avatar1.jpg",
            },
          ],
        },
        {
          id: "request-2",
          sender_id: "sender-2",
          receiver_id: TEST_USER_ID,
          created_at: "2024-01-14T09:00:00Z",
          sender: [
            {
              full_name: "Jane Smith",
              handle: "janesmith",
              photo_url: "https://example.com/avatar2.jpg",
            },
          ],
        },
      ];

      const res = await request(app)
        .get(route)
        .query({ type: "incoming" })
        .set("Authorization", validToken);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        results: [
          {
            id: "request-1",
            fromUser: expect.objectContaining({
              profileId: "sender-1",
            }),
            created_at: "2024-01-15T10:00:00Z",
          },
          {
            id: "request-2",
            fromUser: expect.objectContaining({
              profileId: "sender-2",
            }),
            created_at: "2024-01-14T09:00:00Z",
          },
        ],
        pagination: {
          total: 2,
          page: 1,
          pageSize: 20,
          totalPages: 1,
        },
      });
    });

    it("SUCCESS (200): Handles pagination correctly for incoming requests", async () => {
      mockTotalCount = 25;
      mockConnectionRequestsData = Array.from({ length: 10 }, (_, i) => ({
        id: `request-${i + 11}`, // Second page items
        sender_id: `sender-${i + 11}`,
        receiver_id: TEST_USER_ID,
        created_at: `2024-01-${15 - i}T10:00:00Z`,
        sender: [
          {
            full_name: `User ${i + 11}`,
            handle: `user${i + 11}`,
            photo_url: `https://example.com/avatar${i + 11}.jpg`,
          },
        ],
      }));

      const res = await request(app)
        .get(route)
        .query({ type: "incoming", page: 2, pageSize: 10 })
        .set("Authorization", validToken);

      expect(res.status).toBe(200);
      expect(res.body.results).toHaveLength(10);
      expect(res.body.pagination).toEqual({
        total: 25,
        page: 2,
        pageSize: 10,
        totalPages: 3,
      });
    });
  });

  describe("Outgoing Connection Requests", () => {
    beforeEach(() => {
      mockJwtVerify.mockReturnValue({ sub: TEST_USER_ID });
    });

    it("SUCCESS (200): Returns empty list when no outgoing requests", async () => {
      mockTotalCount = 0;
      mockConnectionRequestsData = [];

      const res = await request(app)
        .get(route)
        .query({ type: "outgoing" })
        .set("Authorization", validToken);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        results: [],
        pagination: {
          total: 0,
          page: 1,
          pageSize: 20,
          totalPages: 0,
        },
      });
    });

    it("SUCCESS (200): Returns outgoing connection requests with proper structure", async () => {
      mockTotalCount = 2;
      mockConnectionRequestsData = [
        {
          id: "request-1",
          sender_id: TEST_USER_ID,
          receiver_id: "receiver-1",
          created_at: "2024-01-15T10:00:00Z",
          receiver: [
            {
              full_name: "Alice Johnson",
              handle: "alicejohnson",
              photo_url: "https://example.com/avatar3.jpg",
            },
          ],
        },
        {
          id: "request-2",
          sender_id: TEST_USER_ID,
          receiver_id: "receiver-2",
          created_at: "2024-01-14T09:00:00Z",
          receiver: [
            {
              full_name: "Bob Wilson",
              handle: "bobwilson",
              photo_url: "https://example.com/avatar4.jpg",
            },
          ],
        },
      ];

      const res = await request(app)
        .get(route)
        .query({ type: "outgoing" })
        .set("Authorization", validToken);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        results: [
          {
            id: "request-1",
            toUser: expect.objectContaining({
              profileId: "receiver-1",
            }),
            created_at: "2024-01-15T10:00:00Z",
          },
          {
            id: "request-2",
            toUser: expect.objectContaining({
              profileId: "receiver-2",
            }),
            created_at: "2024-01-14T09:00:00Z",
          },
        ],
        pagination: {
          total: 2,
          page: 1,
          pageSize: 20,
          totalPages: 1,
        },
      });
    });
  });

  describe("Default Behavior (No Type Parameter)", () => {
    beforeEach(() => {
      mockJwtVerify.mockReturnValue({ sub: TEST_USER_ID });
      mockTotalCount = 1;
      mockConnectionRequestsData = [
        {
          id: "default-request-1",
          sender_id: "sender-default",
          receiver_id: TEST_USER_ID,
          created_at: "2024-01-15T10:00:00Z",
          sender: [
            {
              full_name: "Default Sender",
              handle: "defaultsender",
              photo_url: "https://example.com/default-avatar.jpg",
            },
          ],
        },
      ];
    });

    it("SUCCESS (200): Defaults to incoming requests when no type parameter is provided", async () => {
      const res = await request(app)
        .get(route)
        .set("Authorization", validToken);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        results: [
          {
            id: "default-request-1",
            fromUser: expect.objectContaining({
              profileId: "sender-default",
            }),
            created_at: "2024-01-15T10:00:00Z",
          },
        ],
        pagination: {
          total: 1,
          page: 1,
          pageSize: 20,
          totalPages: 1,
        },
      });
    });
  });

  describe("Database Errors", () => {
    beforeEach(() => {
      mockJwtVerify.mockReturnValue({ sub: TEST_USER_ID });
    });

    it("ERROR (500): Handles database count error", async () => {
      mockCountError = { message: "Database connection failed" };

      const res = await request(app)
        .get(route)
        .query({ type: "incoming" })
        .set("Authorization", validToken);

      expect(res.status).toBe(500);
    });

    it("ERROR (500): Handles database select error", async () => {
      mockTotalCount = 1;
      mockSelectError = { message: "Query failed" };

      const res = await request(app)
        .get(route)
        .query({ type: "incoming" })
        .set("Authorization", validToken);

      expect(res.status).toBe(500);
    });
  });

  describe("Pagination Edge Cases", () => {
    beforeEach(() => {
      mockJwtVerify.mockReturnValue({ sub: TEST_USER_ID });
    });

    it("SUCCESS (200): Uses default pagination values when not provided", async () => {
      mockTotalCount = 5;
      mockConnectionRequestsData = Array.from({ length: 5 }, (_, i) => ({
        id: `request-${i + 1}`,
        sender_id: `sender-${i + 1}`,
        receiver_id: TEST_USER_ID,
        created_at: `2024-01-${15 - i}T10:00:00Z`,
        sender: [
          {
            full_name: `User ${i + 1}`,
            handle: `user${i + 1}`,
            photo_url: `https://example.com/avatar${i + 1}.jpg`,
          },
        ],
      }));

      const res = await request(app)
        .get(route)
        .query({ type: "incoming" })
        .set("Authorization", validToken);

      expect(res.status).toBe(200);
      expect(res.body.pagination).toEqual({
        total: 5,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      });
    });

    it("SUCCESS (200): Handles custom page size", async () => {
      mockTotalCount = 10;
      mockConnectionRequestsData = Array.from({ length: 5 }, (_, i) => ({
        id: `request-${i + 1}`,
        sender_id: `sender-${i + 1}`,
        receiver_id: TEST_USER_ID,
        created_at: `2024-01-${15 - i}T10:00:00Z`,
        sender: [
          {
            full_name: `User ${i + 1}`,
            handle: `user${i + 1}`,
            photo_url: `https://example.com/avatar${i + 1}.jpg`,
          },
        ],
      }));

      const res = await request(app)
        .get(route)
        .query({ type: "incoming", pageSize: 5 })
        .set("Authorization", validToken);

      expect(res.status).toBe(200);
      expect(res.body.pagination).toEqual({
        total: 10,
        page: 1,
        pageSize: 5,
        totalPages: 2,
      });
    });
  });
});
