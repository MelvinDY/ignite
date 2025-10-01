// src/lib/api/search.ts
import { authStateManager } from "../../hooks/useAuth";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.toString() || "http://localhost:3001";

export class SearchApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number
  ) {
    super(message);
    this.name = "SearchApiError";
  }
}

export interface SearchProfile {
  id: string;                 // <-- always populated by mapProfile()
  fullName: string;
  handle: string;
  headline?: string | null;
  photoUrl?: string | null;
  domicileCity?: string | null;
  domicileCountry?: string | null;
  bio?: string | null;
}

export interface SearchFilters {
  q?: string;
  majors?: string[];
  companies?: string[];
  workFields?: string[];
  cities?: string[];
  citizenship?: string[];
  sortBy?: string;
  page?: number;
  pageSize?: number;
}

export interface SearchResponse {
  results: SearchProfile[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

/* ---------- helpers ---------- */

const getAuthHeaders = () => {
  const authState = authStateManager.getState?.();
  const token = authState?.accessToken;
  if (!token) {
    throw new SearchApiError("No access token found", "NOT_AUTHENTICATED", 401);
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  } as const;
};

const handleApiError = async (response: Response) => {
  if (!response.ok) {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      throw new SearchApiError(
        `HTTP ${response.status}`,
        "HTTP_ERROR",
        response.status
      );
    }
    if (response.status === 401) {
      throw new SearchApiError(
        errorData?.message || "Please log in to continue.",
        "NOT_AUTHENTICATED",
        401
      );
    }
    throw new SearchApiError(
      errorData?.message || `HTTP ${response.status}`,
      errorData?.code || "HTTP_ERROR",
      response.status
    );
  }
  return response;
};

/** Map BE shape → FE shape the UI expects */
const mapProfile = (raw: any): SearchProfile => ({
  // BE returns `profileId`; UI expects `id`
  id: raw?.id ?? raw?.profileId ?? "",
  fullName: raw?.fullName ?? "",
  handle: raw?.handle ?? "",
  // BE uses photoUrl (sometimes photo_url). Normalize.
  photoUrl: raw?.photoUrl ?? raw?.photo_url ?? null,
  headline: raw?.headline ?? null,
  domicileCity: raw?.domicileCity ?? null,
  domicileCountry: raw?.domicileCountry ?? null,
  // optional field if BE ever sends it
  bio: raw?.bio ?? null,
});

/* ---------- API ---------- */

export const searchApi = {
  async searchDirectory(filters: SearchFilters): Promise<SearchResponse> {
    const params = new URLSearchParams();
    if (filters.q) params.append("q", filters.q);
    if (filters.majors?.length) params.append("major", filters.majors.join(","));
    if (filters.companies?.length) params.append("companies", filters.companies.join(","));
    if (filters.workFields?.length) params.append("workFields", filters.workFields.join(","));
    if (filters.cities?.length) params.append("cities", filters.cities.join(","));
    if (filters.citizenship?.length) params.append("citizenship", filters.citizenship.join(","));
    if (filters.sortBy) params.append("sortBy", filters.sortBy);
    if (filters.page) params.append("page", String(filters.page));
    if (filters.pageSize) params.append("pageSize", String(filters.pageSize));

    const url = `${API_BASE}/directory/search?${params.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include",
    });

    await handleApiError(response);
    const raw = await response.json();

    const results: SearchProfile[] = Array.isArray(raw?.results)
      ? raw.results.map(mapProfile)
      : [];

    return {
      results,
      pagination: raw?.pagination ?? {
        total: results.length,
        page: filters.page ?? 1,
        pageSize: filters.pageSize ?? results.length,
        totalPages: 1,
      },
    };
  },

  // If you use these lookup endpoints, keep them as-is:
  async getMajors(): Promise<{ id: string; name: string }[]> {
    const response = await fetch(`${API_BASE}/lookup/majors`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include",
    });
    await handleApiError(response);
    return response.json();
  },

  async getCompanies(query?: string): Promise<{ id: string; name: string }[]> {
    const params = query ? `?q=${encodeURIComponent(query)}` : "";
    const response = await fetch(`${API_BASE}/lookup/companies${params}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include",
    });
    await handleApiError(response);
    return response.json();
  },

  async getWorkFields(): Promise<{ id: string; name: string }[]> {
    const response = await fetch(`${API_BASE}/lookup/work-fields`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include",
    });
    await handleApiError(response);
    return response.json();
  },

  async getCities(isIndonesian?: boolean): Promise<{ id: string; name: string }[]> {
    const params = new URLSearchParams();
    if (typeof isIndonesian === "boolean") {
      params.append("isIndonesian", String(isIndonesian));
    }
    const url = `${API_BASE}/lookup/cities${params.toString() ? `?${params.toString()}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include",
    });

    await handleApiError(response);
    return response.json();
  },
};
