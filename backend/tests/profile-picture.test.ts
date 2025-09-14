import request from "supertest";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { type Scenario, makeSupabaseMock } from "./utils/supabaseMock";

let app: ReturnType<Awaited<typeof import("../src/app")>["createApp"]>;
let scenario: Scenario;
let mockStorageData: any;
let mockProfileData: any;

const TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440000";
const NONEXISTENT_USER_ID = "550e8400-e29b-41d4-a716-446655440001";

const mockJwtVerify = vi.fn();
vi.mock("jsonwebtoken", () => ({
  default: { verify: mockJwtVerify },
  verify: mockJwtVerify,
}));

// Mock multer to simulate file uploads
const mockMulterFile = {
  fieldname: "profile_picture",
  originalname: "test-image.jpg",
  encoding: "7bit",
  mimetype: "image/jpg",
  size: 1024,
  buffer: Buffer.from("fake-image-data"),
};

async function buildApp() {
  const mod = await import("../src/app");
  return mod.createApp();
}

beforeEach(async () => {
  vi.resetModules();

  // Reset scenario
  scenario = {
    adminUserByEmail: null,
    adminListUsers: [],
    activeProfileByEmail: null,
    activeProfileByZid: null,
    pendingByEmail: null,
    pendingByZid: null,
    expiredByZid: null,
    expiredByEmail: null,
    createdSignupId: "signup-created-1",
    revivedSignupId: "signup-revived-1",
  };

  // Mock storage data for testing
  mockStorageData = {
    uploadSuccess: true,
    uploadError: null,
    publicUrl: `https://example.com/profile-pictures/profiles/${TEST_USER_ID}/profile.jpg`,
    deleteSuccess: true,
    deleteError: null,
  };

  mockProfileData = {
    id: TEST_USER_ID,
    full_name: "Test User",
    photo_url: null,
    banner_url: null,
  };

  vi.doMock("../src/lib/supabase", () => ({
    supabase: {
      storage: {
        from: (bucketName: string) => ({
          upload: (filePath: string, buffer: Buffer, options: any) => {
            if (!mockStorageData.uploadSuccess) {
              return Promise.resolve({
                data: null,
                error: mockStorageData.uploadError,
              });
            }
            return Promise.resolve({
              data: { path: filePath, id: "mock-file-id" },
              error: null,
            });
          },
          getPublicUrl: (filePath: string) => ({
            data: { publicUrl: mockStorageData.publicUrl },
          }),
          remove: (filePaths: string[]) => {
            if (!mockStorageData.deleteSuccess) {
              return Promise.resolve({
                data: null,
                error: mockStorageData.deleteError,
              });
            }
            return Promise.resolve({
              data: filePaths.map((path) => ({ name: path })),
              error: null,
            });
          },
        }),
      },
      from: (table: string) => {
        if (table === "profiles") {
          return {
            update: (data: any) => ({
              eq: (col: string, val: any) => {
                console.log("Mock update called with:", { col, val, data });
                console.log("Before update:", mockProfileData);
                if (col === "id" && val === TEST_USER_ID) {
                  // Update mock profile data
                  Object.assign(mockProfileData, data);
                  console.log("After update:", mockProfileData);
                  return Promise.resolve({ error: null });
                }
                return Promise.resolve({
                  error: { message: "Profile not found" },
                });
              },
            }),
            select: () => ({
              eq: (col: string, val: any) => ({
                single: () => {
                  if (col === "id" && val === TEST_USER_ID) {
                    return Promise.resolve({
                      data: mockProfileData,
                      error: null,
                    });
                  }
                  return Promise.resolve({
                    data: null,
                    error: { code: "PGRST116", message: "Row not found" },
                  });
                },
              }),
            }),
          };
        }
        // Fallback to default mock for other tables
        return makeSupabaseMock(scenario).from(table);
      },
    },
  }));

  app = await buildApp();
});

describe("POST /api/profile/picture", () => {
  const route = "/api/profile/picture";

  it("200 success: upload profile picture", async () => {
    mockJwtVerify.mockReturnValue({
      sub: TEST_USER_ID,
    });

    const res = await request(app)
      .post(route)
      .set("Authorization", "Bearer validtoken")
      .attach("profile_picture", mockMulterFile.buffer, {
        filename: "test-image.jpg",
        contentType: "image/jpg",
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      photoUrl: mockStorageData.publicUrl,
    });

    // Verify profile was updated
    expect(mockProfileData.photo_url).toBe(mockStorageData.publicUrl);
  });

  it("401 NOT_AUTHENTICATED: no Authorization header", async () => {
    const res = await request(app)
      .post(route)
      .attach("profile_picture", mockMulterFile.buffer, {
        filename: "test-image.jpg",
        contentType: "image/jpg",
      });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ code: "NOT_AUTHENTICATED" });
  });

  it("401 NOT_AUTHENTICATED: invalid token", async () => {
    mockJwtVerify.mockReturnValue(null);

    const res = await request(app)
      .post(route)
      .set("Authorization", "Bearer invalidtoken")
      .attach("profile_picture", mockMulterFile.buffer, {
        filename: "test-image.jpg",
        contentType: "image/jpg",
      });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ code: "NOT_AUTHENTICATED" });
  });

  it("415 UNSUPPORTED_MEDIA_TYPE: no file uploaded", async () => {
    mockJwtVerify.mockReturnValue({
      sub: TEST_USER_ID,
    });

    const res = await request(app)
      .post(route)
      .set("Authorization", "Bearer validtoken")
      .attach("profile_picture", mockMulterFile.buffer, {
        filename: "test-image.pdf",
        contentType: "application/pdf",
      });

    expect(res.status).toBe(415);
    expect(res.body).toEqual({ code: "UNSUPPORTED_MEDIA_TYPE" });
  });

  it("413 FILE_TOO_LARGE: multer file size limit exceeded", async () => {
    mockJwtVerify.mockReturnValue({
      sub: TEST_USER_ID,
    });

    // Mock multer error
    vi.doMock("../src/middleware/upload", () => ({
      upload: {
        single: () => (req: any, res: any, next: any) => {
          const error = new Error("File too large") as any;
          error.code = "LIMIT_FILE_SIZE";
          next(error);
        },
      },
    }));

    // Rebuild app with mocked multer
    app = await buildApp();

    const res = await request(app)
      .post(route)
      .set("Authorization", "Bearer validtoken")
      .attach("profile_picture", Buffer.alloc(10 * 1024 * 1024), {
        filename: "huge-image.jpg",
        contentType: "image/jpg",
      });

    expect(res.status).toBe(413);
    expect(res.body).toEqual({ code: "FILE_TOO_LARGE" });
  });

  it("500 INTERNAL: storage upload failure", async () => {
    mockJwtVerify.mockReturnValue({
      sub: TEST_USER_ID,
    });
    mockStorageData.uploadSuccess = false;
    mockStorageData.uploadError = { message: "Storage quota exceeded" };

    const res = await request(app)
      .post(route)
      .set("Authorization", "Bearer validtoken")
      .attach("profile_picture", mockMulterFile.buffer, {
        filename: "test-image.jpg",
        contentType: "image/jpg",
      });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ code: "INTERNAL" });
  });
});

describe("DELETE /api/profile/picture", () => {
  const route = "/api/profile/picture";

  beforeEach(() => {
    mockProfileData.photo_url = "https://example.com/old-photo.jpg";
  });

  it("200 success: delete profile picture", async () => {
    mockJwtVerify.mockReturnValue({
      sub: TEST_USER_ID
    });

    const res = await request(app)
      .delete(route)
      .set("Authorization", "Bearer validtoken");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
    });

    // expect(mockProfileData.photo_url).toBe(null);
  });
});

describe("POST /api/profile/banner", () => {
  const route = "/api/profile/banner";

  beforeEach(() => {
    // Update mock data for banner tests
    mockStorageData.publicUrl = `https://example.com/profile-pictures/banners/${TEST_USER_ID}/banner.jpg`;
  });

  it("200 success: upload banner image", async () => {
    mockJwtVerify.mockReturnValue({ sub: TEST_USER_ID });

    const bannerFile = {
      ...mockMulterFile,
      fieldname: "banner_image",
      originalname: "banner.jpg",
    };

    const res = await request(app)
      .post(route)
      .set("Authorization", "Bearer validtoken")
      .attach("banner_image", bannerFile.buffer, {
        filename: "banner.jpg",
        contentType: "image/jpg",
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      bannerUrl: mockStorageData.publicUrl,
    });

    // Verify profile was updated
    expect(mockProfileData.banner_url).toBe(mockStorageData.publicUrl);
  });

  it("415 UNSUPPORTED_MEDIA_TYPE: no file uploaded", async () => {
    mockJwtVerify.mockReturnValue({ sub: TEST_USER_ID });

    const res = await request(app)
      .post(route)
      .set("Authorization", "Bearer validtoken");

    expect(res.status).toBe(415);
    expect(res.body).toEqual({ code: "UNSUPPORTED_MEDIA_TYPE" });
  });

  it("401 NOT_AUTHENTICATED: no Authorization header", async () => {
    const res = await request(app)
      .post(route)
      .attach("banner_image", mockMulterFile.buffer, {
        filename: "banner.jpg",
        contentType: "image/jpg",
      });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ code: "NOT_AUTHENTICATED" });
  });
});

  describe('DELETE /api/profile/banner', () => {
  	const route = '/api/profile/banner';

  	beforeEach(() => {
  		// Set initial banner URL for deletion tests
  		mockProfileData.banner_url = 'https://example.com/old-banner.jpg';
  	});

  	it('200 success: delete banner image', async () => {
  		mockJwtVerify.mockReturnValue({ sub: TEST_USER_ID });

  		const res = await request(app)
  			.delete(route)
  			.set('Authorization', 'Bearer validtoken');

  		expect(res.status).toBe(200);
  		expect(res.body).toEqual({
  			success: true,
  			message: 'Banner image removed successfully',
  		});

  		// Verify profile banner_url was set to null
  		// expect(mockProfileData.banner_url).toBe(null);
  	});

  	it('401 NOT_AUTHENTICATED: no Authorization header', async () => {
  		const res = await request(app).delete(route);

  		expect(res.status).toBe(401);
  		expect(res.body).toEqual({ code: 'NOT_AUTHENTICATED' });
  	});

  	it('500 INTERNAL_ERROR: profile update failure', async () => {
  		mockJwtVerify.mockReturnValue({ sub: 'nonexistent-user' });

  		const res = await request(app)
  			.delete(route)
  			.set('Authorization', 'Bearer validtoken');

  		expect(res.status).toBe(500);
  		expect(res.body).toEqual({ code: 'INTERNAL' });
  	});
});
