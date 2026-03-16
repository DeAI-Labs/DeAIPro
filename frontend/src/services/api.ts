import {
  Subnet,
  StatsResponse,
  NewsItem,
  ResearchArticle,
  Lesson,
} from "../types";

// Vite requires import.meta.env (not process.env)
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://deai-kyzf.onrender.com";

// All routes are under /api prefix (matches FastAPI router prefix="/api")
const API = `${API_BASE_URL}/api`;

const DEFAULT_HEADERS = { "Content-Type": "application/json" };

export const getAuthHeader = (token?: string) =>
  token ? { Authorization: `Bearer ${token}` } : {};

export class APIError extends Error {
  constructor(message: string, public status?: number, public data?: any) {
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

// ── Public ────────────────────────────────────────────────────────────────────

export const checkHealth = async () =>
  handleResponse(await fetch(`${API}/health`, { headers: DEFAULT_HEADERS }));

export const getStats = async (): Promise<StatsResponse> =>
  handleResponse(await fetch(`${API}/stats`, { headers: DEFAULT_HEADERS }));

export const getSubnets = async (
  detailed = false,
  token?: string
): Promise<Subnet[]> => {
  const params = detailed ? "?detailed=true" : "";
  return handleResponse(
    await fetch(`${API}/subnets${params}`, {
      headers: { ...DEFAULT_HEADERS, ...getAuthHeader(token) },
    })
  );
};

export const getNews = async (): Promise<NewsItem[]> =>
  handleResponse(await fetch(`${API}/news`, { headers: DEFAULT_HEADERS }));

export const getResearch = async (): Promise<ResearchArticle[]> =>
  handleResponse(await fetch(`${API}/research`, { headers: DEFAULT_HEADERS }));

export const getLessons = async (): Promise<Lesson[]> =>
  handleResponse(await fetch(`${API}/lessons`, { headers: DEFAULT_HEADERS }));

export const requestAccess = async (email: string) =>
  handleResponse(
    await fetch(`${API}/request-access`, {
      method: "POST",
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({ email }),
    })
  );

export const getHistoricalTAO = async (
  days = 30
): Promise<Array<{ date: string; price: number }>> =>
  handleResponse(
    await fetch(`${API}/historical/tao?days=${days}`, { headers: DEFAULT_HEADERS })
  );

// ── Authenticated ─────────────────────────────────────────────────────────────

export const getSubnetsDetailed = async (token: string) =>
  handleResponse(
    await fetch(`${API}/subnets-detailed`, {
      headers: { ...DEFAULT_HEADERS, ...getAuthHeader(token) },
    })
  );

// ── Admin ─────────────────────────────────────────────────────────────────────

export const approveAccess = async (email: string, token: string) =>
  handleResponse(
    await fetch(`${API}/admin/approve-access`, {
      method: "POST",
      headers: { ...DEFAULT_HEADERS, ...getAuthHeader(token) },
      body: JSON.stringify({ email }),
    })
  );

export const getAdminStatus = async (token: string) =>
  handleResponse(
    await fetch(`${API}/admin/status`, {
      headers: { ...DEFAULT_HEADERS, ...getAuthHeader(token) },
    })
  );

// ── Batch ─────────────────────────────────────────────────────────────────────

export const fetchAllPublicData = async () => {
  const [stats, subnets, news, research, lessons] = await Promise.all([
    getStats().catch(() => null),
    getSubnets().catch(() => []),
    getNews().catch(() => []),
    getResearch().catch(() => []),
    getLessons().catch(() => []),
  ]);
  return { stats, subnets, news, research, lessons };
};

export const fetchAllAuthenticatedData = async (token: string) => {
  const publicData = await fetchAllPublicData();
  const detailedSubnets = await getSubnetsDetailed(token).catch(() => null);
  return { ...publicData, detailedSubnets };
};
