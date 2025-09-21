import { success, z } from "zod";
import { authStateManager } from "../../hooks/useAuth";

// Prefer configured base URL; fall back to same-origin proxy
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

// Error Response Schema
const ErrorResponseSchema = z.object({
  success: z.literal(false).optional(),
  code: z.string(),
  message: z.string().optional(),
  details: z.any().optional(),
});

// Profile Me Response Schema (matches backend ProfileObject and OpenAPI spec)
const ProfileMeResponseSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  handle: z.string().nullable(),
  photoUrl: z.string().nullable(),
  isIndonesian: z.boolean(),
  program: z.string().nullable(),
  major: z.string().nullable(),
  level: z.enum(["foundation", "diploma", "undergrad", "postgrad", "phd"]),
  yearStart: z.number(),
  yearGrad: z.number().nullable(),
  zid: z.string(),
  headline: z.string().nullable(),
  domicileCity: z.string().nullable(),
  domicileCountry: z.string().nullable(),
  bio: z.string().nullable(),
  socialLinks: z.any(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Public profile (by slug/handle)
const PublicProfileResponseSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  handle: z.string(),
  photoUrl: z.string().nullable(),
  program: z.string().nullable(),
  major: z.string().nullable(),
  level: z.enum(["foundation", "diploma", "undergrad", "postgrad", "phd"]),
  yearStart: z.number(),
  yearGrad: z.number().nullable(),
  headline: z.string().nullable(),
  domicileCity: z.string().nullable(),
  bio: z.string().nullable(),
  socialLinks: z.any(),
});

const EducationSchema = z.object ({
  id: z.string(),
  school: z.string(),
  program: z.string().nullable(),
  major: z.string().nullable(),
  startMonth: z.number().int().min(1).max(12),
  startYear: z.number().int(),
  endMonth: z.number().int().min(1).max(12).nullable(),
  endYear: z.number().int().nullable(),
});

const ExperienceSchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string().nullable(),
  fieldOfWork: z.string().nullable(),
  startMonth: z.number().int().min(1).max(12),
  startYear: z.number().int(),
  endMonth: z.number().int().min(1).max(12).nullable(),
  endYear: z.number().int().nullable(),
  isCurrent: z.boolean(),
  employmentType: z.string().nullable(),
  locationCity: z.string().nullable(),
  locationCountry: z.string().nullable(),
  locationType: z.string().nullable(),
  description: z.string().nullable(),
});

// Public profile with details (includes experiences and education)
const PublicProfileWithDetailsResponseSchema = z.object({
  profile: PublicProfileResponseSchema,
  experiences: z.array(ExperienceSchema),
  educations: z.array(EducationSchema),
});

// Handle Check Response Schema
const HandleCheckResponseSchema = z.object({
  available: z.boolean(),
});

// Update Handle Request Schema
const UpdateHandleRequestSchema = z.object({
  handle: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9._-]+$/),
});

const UpdateHandleResponseSchema = z.object({
  success: z.literal(true),
  handle: z.string(),
});

const SkillsResponseSchema = z.array(
  z.object({
    id: z.number(),
    name: z.string(),
  })
);

const UpdateSkillsResponseSchema = z.object({
  success: z.literal(true),
  id: z.number().int(),
  name: z.string(),
});

const ProfileEducationResponseSchema = z.array(EducationSchema);

const AddEducationRequestSchema = z.object({
  school: z.string().min(1).max(30),
  program: z.string().min(1).transform(v => v.trim()),
  major: z.string().min(1).transform(v => v.trim()),
  startMonth: z.number().int().min(1).max(12),
  startYear: z.number().int().min(1900).max(2100),
  endMonth: z.number().int().min(1).max(12).nullable(),
  endYear: z.number().int().min(1900).max(2100).nullable(),
}).superRefine((v, ctx) => {
  // both endMonth/endYear must be present or both null
  const bothOrNeither =
    (v.endMonth == null && v.endYear == null) ||
    (v.endMonth != null && v.endYear != null);
  if (!bothOrNeither) {
    ctx.addIssue({
      code: "custom",                         // <- use string literal
      message: "If either endMonth or endYear is provided, both must be provided",
      path: ["endMonth"],
    });
  }

  // if provided, end must be >= start
  if (v.endMonth != null && v.endYear != null) {
    const start = v.startYear * 12 + (v.startMonth - 1);
    const end   = v.endYear  * 12 + (v.endMonth  - 1);
    if (end < start) {
      ctx.addIssue({
        code: "custom",
        message: "End date must be same as or after start date",
        path: ["endYear"],
      });
    }
  }
});

const AddEducationResponseSchema = z.object({

  success: z.literal(true),
  id: z.string(),
})

const UpdateEducationRequestSchema = z.object({
  school: z.string().min(1).max(30),
  program: z.string().trim().min(1),
  major: z.string().trim().min(1),
  startMonth: z.coerce.number().int().min(1).max(12),
  startYear: z.coerce.number().int().min(1900).max(2100),
  endMonth: z.coerce.number().int().min(1).max(12).nullable(),
  endYear: z.coerce.number().int().min(1900).max(2100).nullable(),
}).superRefine((v, ctx) => {
  // both endMonth/endYear must be present or both null (unchanged logic)
  const bothOrNeither =
    (v.endMonth == null && v.endYear == null) ||
    (v.endMonth != null && v.endYear != null);
  if (!bothOrNeither) {
    ctx.addIssue({
      code: "custom",
      message: "If either endMonth or endYear is provided, both must be provided",
      path: ["endMonth"],
    });
  }

  // chronology check when both provided (unchanged logic)
  if (v.endMonth != null && v.endYear != null) {
    const start = v.startYear * 12 + (v.startMonth - 1);
    const end   = v.endYear  * 12 + (v.endMonth  - 1);
    if (end < start) {
      ctx.addIssue({
        code: "custom",
        message: "End date must be same as or after start date",
        path: ["endYear"],
      });
    }
  }
})

const UpdateEducationResponseSchema = z.object({
  success: z.literal(true),
})

const DeleteEducationResponseSchema = z.object({
  success: z.literal(true),
});

const ProfileExperienceResponseSchema = z.array(ExperienceSchema);

const CreateExperienceRequestSchema = z.object({
  roleTitle: z.string().min(1).max(120),
  company: z.string().min(1).max(120),
  fieldOfWork: z.string().min(1).max(120).optional(),
  employmentType: z.enum([
    'full_time', 'part_time', 'contract', 'internship', 'temporary', 'volunteer', 'freelance'
  ]).optional(),
  locationCity: z.string().optional(),
  locationCountry: z.string().regex(/^[A-Z]{2}$/).optional(),
  locationType: z.enum(['on_site', 'remote', 'hybrid']).optional(),
  startMonth: z.number().int().min(1).max(12),
  startYear: z.number().int().min(1900).max(2100),
  endMonth: z.number().int().min(1).max(12).nullable().optional(),
  endYear: z.number().int().min(1900).max(2100).nullable().optional(),
  isCurrent: z.boolean(),
  description: z.string().max(2000).optional(),
}).superRefine((v, ctx) => {
  const endProvided = v.endMonth != null || v.endYear != null;

  if (v.isCurrent) {
    if (endProvided) {
      ctx.addIssue({
        code: 'custom',
        message: "When isCurrent is true, endMonth/endYear must be omitted",
        path: ['endMonth']
      });
      ctx.addIssue({
        code: 'custom',
        message: "When isCurrent is true, endMonth/endYear must be omitted",
        path: ['endYear']
      });
    }
    return;
  }

  if (v.endMonth == null || v.endYear == null) {
    if (v.endMonth == null) {
      ctx.addIssue({ code: 'custom', message: "endMonth is required when isCurrent is false", path: ['endMonth'] });
    }
    if (v.endYear == null) {
      ctx.addIssue({ code: 'custom', message: "endYear is required when isCurrent is false", path: ['endYear'] });
    }
    return;
  }

  const startNum = v.startYear * 12 + (v.startMonth - 1);
  const endNum = v.endYear * 12 + (v.endMonth - 1);
  if (endNum < startNum) {
    ctx.addIssue({
      code: 'custom',
      message: "End date must be same month or after start date",
      path: ['endYear']
    });
  }
});

const UpdateExperienceRequestSchema = z.object({
  roleTitle: z.string().min(1).max(120).optional(),
  company: z.string().min(1).max(120).optional(),
  fieldOfWork: z.string().min(1).max(120).optional(),
  employmentType: z.enum([
    'full_time', 'part_time', 'contract', 'internship', 'temporary', 'volunteer', 'freelance'
  ]).optional(),
  locationCity: z.string().optional(),
  locationCountry: z.string().regex(/^[A-Z]{2}$/).optional(),
  locationType: z.enum(['on_site', 'remote', 'hybrid']).optional(),
  startMonth: z.number().int().min(1).max(12).optional(),
  startYear: z.number().int().min(1900).max(2100).optional(),
  endMonth: z.number().int().min(1).max(12).nullable().optional(),
  endYear: z.number().int().min(1900).max(2100).nullable().optional(),
  isCurrent: z.boolean().optional(),
  description: z.string().max(2000).optional(),
});

const CreateExperienceResponseSchema = z.object({
  success: z.literal(true),
  id: z.string(),

})

// Profile Picture Schemas
const ProfilePictureUploadResponseSchema = z.object({
  success: z.literal(true),
  photoUrl: z.string(),
});

const ProfilePictureDeleteResponseSchema = z.object({
  success: z.literal(true),
})

// Types
export type ProfileMe = z.infer<typeof ProfileMeResponseSchema>;
export type PublicProfile = z.infer<typeof PublicProfileResponseSchema>;
export type PublicProfileWithDetails = z.infer<typeof PublicProfileWithDetailsResponseSchema>;
export type HandleCheckResponse = z.infer<typeof HandleCheckResponseSchema>;
export type UpdateHandleRequest = z.infer<typeof UpdateHandleRequestSchema>;
export type UpdateHandleResponse = z.infer<typeof UpdateHandleResponseSchema>;
export type ProfileSkills = z.infer<typeof SkillsResponseSchema>;
export type UpdateSkillsResponse = z.infer<typeof UpdateSkillsResponseSchema>;
export type Education = z.infer<typeof EducationSchema>;
export type ProfileEducationResponse = z.infer<typeof ProfileEducationResponseSchema>;
export type AddEducationRequest = z.infer<typeof AddEducationRequestSchema>;
export type AddEducationResponse = z.infer<typeof AddEducationResponseSchema>;
export type UpdateEducationRequest = z.infer<typeof UpdateEducationRequestSchema>;
export type UpdateEducationResponse = z.infer<typeof UpdateEducationResponseSchema>;
export type DeleteEducationResponse = z.infer<typeof DeleteEducationResponseSchema>;
export type Experience = z.infer<typeof ExperienceSchema>;
export type ProfileExperienceResponse = z.infer<typeof ProfileExperienceResponseSchema>;
export type CreateExperienceRequest = z.infer<typeof CreateExperienceRequestSchema>;
export type UpdateExperienceRequest = z.infer<typeof UpdateExperienceRequestSchema>;
export type CreateExperienceResponse = z.infer<typeof CreateExperienceResponseSchema>;
export type ProfilePictureUploadResponse = z.infer<typeof ProfilePictureUploadResponseSchema>;
export type ProfilePictureDeleteResponse = z.infer<typeof ProfilePictureDeleteResponseSchema>;

// Error types
export type ProfileError = {
  success: false;
  code:
    | "HANDLE_TAKEN"
    | "HANDLE_INVALID"
    | "PROFILE_NOT_FOUND"
    | "NOT_AUTHENTICATED"
    | "UNAUTHORIZED"
    | "VALIDATION_ERROR"
    | "NETWORK_ERROR"
    | "UNKNOWN_ERROR";
  message: string;
  details?: any;
};

export class ProfileApiError extends Error {
  public readonly code: ProfileError["code"];
  public readonly status: number;
  public readonly details?: any;

  constructor(
    code: ProfileError["code"],
    status: number,
    message: string,
    details?: any
  ) {
    super(message);
    this.name = "ProfileApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

class ProfileApi {
  private getAuthHeaders(): HeadersInit {
    // Get access token from auth state manager
    const authState = authStateManager.getState();
    const token = authState.accessToken || "";
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    responseSchema?: z.ZodSchema<T>,
    isRetry: boolean = false
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      let data: unknown;
      try {
        data = await response.json();
      } catch {
        throw new ProfileApiError(
          "NETWORK_ERROR",
          response.status,
          "Invalid JSON response"
        );
      }

      if (!response.ok) {
        const errorResult = ErrorResponseSchema.safeParse(data);
        if (errorResult.success) {
          // If we get a 401 and haven't already retried, attempt token refresh
          if (response.status === 401 && !isRetry && errorResult.data.code === "NOT_AUTHENTICATED") {
            try {
              console.log("Access token expired, attempting refresh...");
              // Import authApi here to avoid circular dependency
              const { authApi } = await import("../authApi");
              const refreshResponse = await authApi.refresh();

              // Update the auth state with new token
              authStateManager.setAuth(refreshResponse.accessToken, refreshResponse.userId, refreshResponse.expiresIn);
              console.log("Token refreshed successfully, retrying original request");

              // Retry the original request with new token
              return this.request(endpoint, options, responseSchema, true);
            } catch (refreshError) {
              console.log("Token refresh failed, clearing auth state");
              // Refresh failed, clear auth state and throw original error
              authStateManager.clearAuth();
              throw new ProfileApiError(
                errorResult.data.code as ProfileError["code"],
                response.status,
                errorResult.data.message || `Error: ${errorResult.data.code}`,
                errorResult.data.details
              );
            }
          }

          throw new ProfileApiError(
            errorResult.data.code as ProfileError["code"],
            response.status,
            errorResult.data.message || `Error: ${errorResult.data.code}`,
            errorResult.data.details
          );
        }
        throw new ProfileApiError(
          "UNKNOWN_ERROR",
          response.status,
          "Unknown error occurred"
        );
      }

      if (responseSchema) {
        const result = responseSchema.safeParse(data);
        if (!result.success) {
          console.error("Response validation failed:", result.error);
          throw new ProfileApiError(
            "UNKNOWN_ERROR",
            200,
            "Invalid response format"
          );
        }
        return result.data;
      }

      return data as T;
    } catch (error) {
      if (error instanceof ProfileApiError) {
        throw error;
      }

      // Network or other errors
      throw new ProfileApiError(
        "NETWORK_ERROR",
        0,
        "Unable to connect to server"
      );
    }
  }

  async getMyProfile(): Promise<ProfileMe> {
    return this.request(
      "/profile/me",
      {
        method: "GET",
      },
      ProfileMeResponseSchema
    );
  }

  async getPublicProfile(handle: string): Promise<Omit<ProfileMe, 'zid'>> {
    return this.request(
      `/profile/${encodeURIComponent(handle)}`,
      {
        method: "GET",
      },
      ProfileMeResponseSchema.omit({ zid: true })
    );
  }

  async checkHandleAvailability(handle: string): Promise<boolean> {
    const response = await this.request(
      `/handles/check?handle=${encodeURIComponent(handle)}`,
      {
        method: "GET",
      },
      HandleCheckResponseSchema
    );
    return response.available;
  }

  async updateHandle(handle: string): Promise<UpdateHandleResponse> {
    return this.request(
      "/profile/handle",
      {
        method: "PATCH",
        body: JSON.stringify({ handle }),
      },
      UpdateHandleResponseSchema
    );
  }

  async getSkills(): Promise<ProfileSkills> {
    return this.request(
      "/profile/skills",
      {
        method: "GET",
      },
      SkillsResponseSchema
    );
  }

  async addSkills(skill: string): Promise<UpdateSkillsResponse> {
    return this.request(
      "/profile/skills",
      {
        method: "POST",
        body: JSON.stringify({ skill: skill }),
      },
      UpdateSkillsResponseSchema
    );
  }

  async deleteSkill(skillId: number): Promise<{ success: true }> {
    return this.request(
      `/profile/skills/${skillId}`,
      {
        method: "DELETE",
      },
      z.object({ success: z.literal(true) })
    );
  }

  async getProfileEducations(): Promise<ProfileEducationResponse> {
    return this.request('/profile/educations', {
      method: 'GET',
    }, ProfileEducationResponseSchema);
  }

  async addEducations(input: AddEducationRequest): Promise<AddEducationResponse> {
    const parsed = AddEducationRequestSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      const formErrors: string[] = [];
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]?.toString();
        if (key) {
          (fieldErrors[key] ??= []).push(issue.message);
        } else {
          formErrors.push(issue.message);
        }
      }
      throw new ProfileApiError(
        'VALIDATION_ERROR',
        0,
        'Invalid education payload',
        { fieldErrors, formErrors }
      );
    }

    return this.request('/profile/educations', {
      method: 'POST',
      body: JSON.stringify(parsed.data),
    }, AddEducationResponseSchema);
  }

  async updateEducations(id: string, body: UpdateEducationRequest): Promise<UpdateEducationResponse> {
    const parsed = UpdateEducationRequestSchema.safeParse(body);
    if (!parsed.success) {
      console.error("UpdateEducation validation errors:", parsed.error.format());
      throw new Error('Validation failed');
    }
    return this.request(`/profile/educations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(parsed.data),
    }, UpdateEducationResponseSchema);
  }

  async deleteEducation(id: string): Promise<{ success: true }> {
    return this.request(`/profile/educations/${id}`, {
      method: 'DELETE',
    }, z.object({ success: z.literal(true) }));
  }

  async getProfileExperiences(): Promise<ProfileExperienceResponse> {
    return this.request('/profile/experiences', {
      method: 'GET',
    }, ProfileExperienceResponseSchema);
  }

  async createExperience(input: CreateExperienceRequest): Promise<CreateExperienceResponse> {
    const parsed = CreateExperienceRequestSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      const formErrors: string[] = [];
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]?.toString();
        if (key) {
          (fieldErrors[key] ??= []).push(issue.message);
        } else {
          formErrors.push(issue.message);
        }
      }
      throw new ProfileApiError(
        'VALIDATION_ERROR',
        0,
        'Invalid experience payload',
        { fieldErrors, formErrors }
      );
    }

    return this.request('/profile/experiences', {
      method: 'POST',
      body: JSON.stringify(parsed.data),
    }, CreateExperienceResponseSchema);
  }

  async deleteEducations(id: string): Promise<DeleteEducationResponse> {
    return this.request(`/profile/educations/${encodeURIComponent(id)}`, {
      method: "DELETE"
    }, DeleteEducationResponseSchema);
  }

  async updateExperience(id: string, input: UpdateExperienceRequest): Promise<{ success: true }> {
    return this.request(`/profile/experiences/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }, z.object({ success: z.literal(true) }));
  }

  async deleteExperience(id: string): Promise<{ success: true }> {
    return this.request(`/profile/experiences/${id}`, {
      method: 'DELETE',
    }, z.object({ success: z.literal(true) }));
  }

  async uploadProfilePicture(file: File): Promise<ProfilePictureUploadResponse> {
    const formData = new FormData();
    formData.append('photo', file);

    // Special request for file upload - we don't set Content-Type header
    // as the browser will set it with the boundary parameter
    const url = `${API_BASE_URL}/profile/picture`;
    const authState = authStateManager.getState();
    const token = authState.accessToken || "";

    try {
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorResult = ErrorResponseSchema.safeParse(errorData);
        if (errorResult.success) {
          throw new ProfileApiError(
            errorResult.data.code as ProfileError["code"],
            response.status,
            errorResult.data.message || `Error: ${errorResult.data.code}`,
            errorResult.data.details
          );
        }
        throw new ProfileApiError(
          "UNKNOWN_ERROR",
          response.status,
          "Failed to upload profile picture"
        );
      }

      const data = await response.json();
      const result = ProfilePictureUploadResponseSchema.safeParse(data);
      if (!result.success) {
        throw new ProfileApiError(
          "UNKNOWN_ERROR",
          200,
          "Invalid response format"
        );
      }

      return result.data;
    } catch (error) {
      if (error instanceof ProfileApiError) {
        throw error;
      }
      throw new ProfileApiError(
        "NETWORK_ERROR",
        0,
        "Unable to upload profile picture"
      );
    }
  }

  async deleteProfilePicture(): Promise<ProfilePictureDeleteResponse> {
    return this.request(
      '/profile/picture',
      {
        method: 'DELETE',
      },
      ProfilePictureDeleteResponseSchema
    );
  }
}

export const profileApi = new ProfileApi();
