import { authStateManager } from "../../hooks/useAuth";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

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
  id: string;
  fullName: string;
  handle: string;
  headline?: string;
  photoUrl?: string;
  domicileCity?: string;
  domicileCountry?: string;
  bio?: string;
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

export interface LookupOption {
  id: string;
  name: string;
}

const getAuthHeaders = () => {
  const authState = authStateManager.getState();
  const token = authState.accessToken;
  if (!token) {
    throw new SearchApiError("No access token found", "NOT_AUTHENTICATED", 401);
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

const handleApiError = async (response: Response) => {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      throw new SearchApiError(
        `HTTP ${response.status}`,
        "HTTP_ERROR",
        response.status
      );
    }

    throw new SearchApiError(
      errorData.message || `HTTP ${response.status}`,
      errorData.code || "HTTP_ERROR",
      response.status
    );
  }
  return response;
};

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
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.pageSize) params.append("pageSize", filters.pageSize.toString());

    const url = `${API_BASE}/directory/search?${params.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    await handleApiError(response);
    return response.json();
  },

  async getMajors(): Promise<LookupOption[]> {
    const response = await fetch(`${API_BASE}/lookup/majors`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    await handleApiError(response);
    return response.json();
  },

  async getCompanies(query?: string): Promise<LookupOption[]> {
    const params = query ? `?q=${encodeURIComponent(query)}` : "";
    const response = await fetch(`${API_BASE}/lookup/companies${params}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    await handleApiError(response);
    return response.json();
  },

  async getWorkFields(): Promise<LookupOption[]> {
    const response = await fetch(`${API_BASE}/lookup/work-fields`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    await handleApiError(response);
    return response.json();
  },

  async getCities(isIndonesian?: boolean): Promise<LookupOption[]> {
    const params = new URLSearchParams();
    if (typeof isIndonesian === 'boolean') {
      params.append('isIndonesian', isIndonesian.toString());
    }
    const queryString = params.toString();
    const url = `${API_BASE}/lookup/cities${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    await handleApiError(response);
    return response.json();
  },
};