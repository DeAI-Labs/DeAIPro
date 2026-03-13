import {
  Subnet,
  StatsResponse,
  NewsItem,
  ResearchArticle,
  Lesson,
  AccessRequest,
} from "../types";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:8000/api";

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

export const getAuthHeader = (token?: string) => {
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`,
  };
};

// Error handling
export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: any
  ) {
    super(message);
    this.name = "APIError";
  }
}

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new APIError(
      errorData.detail || `API Error: ${response.status}`,
      response.status,
      errorData
    );
  }
  return response.json();
};

// ============ Public Endpoints ============

/**
 * Health check endpoint
 */
export const checkHealth = async (): Promise<{
  status: string;
  timestamp: string;
  service: string;
  version: string;
}> => {
  const response = await fetch(`${API_BASE_URL}/health`, {
    method: "GET",
    headers: DEFAULT_HEADERS,
  });
  return handleResponse(response);
};

/**
 * Get global statistics (TAO price, market cap, active subnets)
 */
export const getStats = async (): Promise<StatsResponse> => {
  const response = await fetch(`${API_BASE_URL}/stats`, {
    method: "GET",
    headers: DEFAULT_HEADERS,
  });
  return handleResponse(response);
};

/**
 * Get subnet list with optional detailed mode
 */
export const getSubnets = async (
  detailed: boolean = false,
  token?: string
): Promise<Subnet[]> => {
  const params = new URLSearchParams();
  if (detailed) params.append("detailed", "true");

  const response = await fetch(`${API_BASE_URL}/subnets?${params.toString()}`, {
    method: "GET",
    headers: {
      ...DEFAULT_HEADERS,
      ...getAuthHeader(token),
    },
  });
  return handleResponse(response);
};

/**
 * Get news feed
 */
export const getNews = async (): Promise<NewsItem[]> => {
  const response = await fetch(`${API_BASE_URL}/news`, {
    method: "GET",
    headers: DEFAULT_HEADERS,
  });
  return handleResponse(response);
};

/**
 * Get research articles
 */
export const getResearch = async (): Promise<ResearchArticle[]> => {
  const response = await fetch(`${API_BASE_URL}/research`, {
    method: "GET",
    headers: DEFAULT_HEADERS,
  });
  return handleResponse(response);
};

/**
 * Get educational lessons
 */
export const getLessons = async (): Promise<Lesson[]> => {
  const response = await fetch(`${API_BASE_URL}/lessons`, {
    method: "GET",
    headers: DEFAULT_HEADERS,
  });
  return handleResponse(response);
};

/**
 * Request access to the platform
 */
export const requestAccess = async (
  email: string
): Promise<{
  success: boolean;
  message: string;
  email: string;
}> => {
  const response = await fetch(`${API_BASE_URL}/request-access`, {
    method: "POST",
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({ email }),
  });
  return handleResponse(response);
};

export const getHistoricalTAO = async (
  days: number = 30
): Promise<Array<{ date: string; price: number }>> => {
  const response = await fetch(`${API_BASE_URL}/historical/tao?days=${days}`, {
    method: "GET",
    headers: DEFAULT_HEADERS,
  });
  return handleResponse(response);
};

// ============ Authenticated Endpoints ============

/**
 * Get detailed subnet information (requires authentication)
 */
export const getSubnetsDetailed = async (
  token: string
): Promise<{ authenticated: boolean; subnets: Subnet[]; timestamp: string }> => {
  const response = await fetch(`${API_BASE_URL}/subnets-detailed`, {
    method: "GET",
    headers: {
      ...DEFAULT_HEADERS,
      ...getAuthHeader(token),
    },
  });
  return handleResponse(response);
};

// ============ Admin Endpoints ============

/**
 * Approve user access (admin only)
 */
export const approveAccess = async (
  email: string,
  token: string
): Promise<{
  success: boolean;
  message: string;
  uid: string;
  reset_link: string;
  expires_in_hours: number;
}> => {
  const response = await fetch(`${API_BASE_URL}/admin/approve-access`, {
    method: "POST",
    headers: {
      ...DEFAULT_HEADERS,
      ...getAuthHeader(token),
    },
    body: JSON.stringify({ email }),
  });
  return handleResponse(response);
};

/**
 * Get admin status and system info (admin only)
 */
export const getAdminStatus = async (token: string): Promise<{
  admin: string;
  cache_available: boolean;
  timestamp: string;
}> => {
  const response = await fetch(`${API_BASE_URL}/admin/status`, {
    method: "GET",
    headers: {
      ...DEFAULT_HEADERS,
      ...getAuthHeader(token),
    },
  });
  return handleResponse(response);
};

// ============ Batch Operations ============

/**
 * Fetch all public data at once
 */
export const fetchAllPublicData = async () => {
  const [stats, subnets, news, research, lessons] = await Promise.all([
    getStats().catch(() => null),
    getSubnets().catch(() => []),
    getNews().catch(() => []),
    getResearch().catch(() => []),
    getLessons().catch(() => []),
  ]);

  return {
    stats,
    subnets,
    news,
    research,
    lessons,
  };
};

/**
 * Fetch all authenticated data at once
 */
export const fetchAllAuthenticatedData = async (token: string) => {
  const publicData = await fetchAllPublicData();
  const [detailedSubnets] = await Promise.all([
    getSubnetsDetailed(token).catch(() => null),
  ]);

  return {
    ...publicData,
    detailedSubnets,
  };
};
