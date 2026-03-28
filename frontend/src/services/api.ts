import {
  Subnet,
  StatsResponse,
  NewsItem,
  ResearchArticle,
  Lesson,
} from "../types";

// Next.js uses process.env.NEXT_PUBLIC_
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://deai-kyzf.onrender.com";

// All routes are under /api prefix (matches FastAPI router prefix="/api")
const API = `${API_BASE}/api`;

// --- START DEBUG LOGGING ---
console.log("🛠️ [DEBUG] NEXT_PUBLIC_API_URL is:", process.env.NEXT_PUBLIC_API_URL);
console.log("🛠️ [DEBUG] API_BASE resolved to:", API_BASE);
console.log("🛠️ [DEBUG] Full API endpoint is:", API);
// --- END DEBUG LOGGING ---

const DEFAULT_HEADERS = { "Content-Type": "application/json" };

export const getAuthHeader = (token?: string): Record<string, string> =>
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
  const json = await response.json();
  // Unwrap the FastAPI data envelope if it exists
  return json.data !== undefined ? json.data : json;
};

const fetchWithRetry = async (url: string, options: RequestInit = {}, retries = 3): Promise<Response> => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response; 
      }
      if (response.status >= 500 && i < retries - 1) {
         document.dispatchEvent(new CustomEvent('backend-reconnecting', { detail: { attempt: i + 1 } }));
         await new Promise(res => setTimeout(res, Math.pow(2, i) * 1000));
         continue;
      }
      return response;
    } catch (err: any) {
      if (i < retries - 1) {
         document.dispatchEvent(new CustomEvent('backend-reconnecting', { detail: { attempt: i + 1 } }));
         await new Promise(res => setTimeout(res, Math.pow(2, i) * 1000));
         continue;
      }
      throw err;
    }
  }
  throw new Error("Fetch failed after retries");
};

// ── Public ────────────────────────────────────────────────────────────────────

export const checkHealth = async () =>
  handleResponse(await fetchWithRetry(`${API}/health`, { headers: DEFAULT_HEADERS }));

export const getStats = async (): Promise<StatsResponse> =>
  handleResponse(await fetchWithRetry(`${API}/stats`, { headers: DEFAULT_HEADERS }));

export const getSubnets = async (
  detailed = false,
  token?: string
): Promise<Subnet[]> => {
  const params = detailed ? "?detailed=true" : "";
  const data = await handleResponse(
    await fetchWithRetry(`${API}/subnets${params}`, {
      headers: { ...DEFAULT_HEADERS, ...getAuthHeader(token) },
    })
  );
  
  if (!Array.isArray(data)) return [];
  
  return data.map((s: any) => ({
    id: s.id,
    n: s.name || `Subnet ${s.id}`,
    cat: s.category || "General",
    mc: s.market_cap_millions || 0,
    em: s.daily_emission || 0,
    tao: 191.43,
    pe: s.apy ? 100 / s.apy : 1.42,
    reg: 18.79,
    val: s.validators_count || 0,
    trend: s.trend || "up",
    score: s.quality_score || 80,
    alpha: 0.1,
    validators: s.validators_count || 0,
    miners: s.miners_count || 250,
    share: s.daily_emission || 10,
    dailyTao: s.daily_emission || 400,
    uptime: 99,
    emission: s.daily_emission || 10,
    github: 80,
    commits: s.github_commits_30d || 100,
    contributors: 15,
    stars: 300,
    testCov: s.test_coverage || 80,
    docScore: 80,
    momentum: s.momentum_score || 10,
    liquidity: 90,
    quality: s.quality_score || 85,
    economic: 85,
    network: 90,
    fundamental: 85,
    live: true
  }));
};

export const getNews = async (): Promise<NewsItem[]> => {
  const data = await handleResponse(await fetchWithRetry(`${API}/news`, { headers: DEFAULT_HEADERS }));
  if (!Array.isArray(data)) return [];
  return data.map((n: any) => ({
    tg: n.category || "GENERAL",
    t: n.title,
    s: n.source || "News",
    tm: new Date(n.published_at).toLocaleDateString() || "Recent",
    url: n.url || "#"
  }));
};

export const getResearch = async (): Promise<ResearchArticle[]> => {
  const data = await handleResponse(await fetchWithRetry(`${API}/research`, { headers: DEFAULT_HEADERS }));
  if (!Array.isArray(data)) return [];
  return data.map((r: any) => ({
    i: r.icon || "📄",
    c: r.category || "Research",
    t: r.title,
    ex: r.excerpt || "",
    d: new Date(r.published_date).toLocaleDateString() || "",
    content: r.content || ""
  }));
};

export const getLessons = async (): Promise<Lesson[]> => {
  const data = await handleResponse(await fetchWithRetry(`${API}/lessons`, { headers: DEFAULT_HEADERS }));
  if (!Array.isArray(data)) return [];
  return data.map((l: any) => ({
    id: l.id || Math.floor(Math.random() * 1000),
    title: l.title,
    category: l.category || "General",
    level: l.level || "beginner",
    duration: l.duration_minutes || 10,
    content: l.content || ""
  }));
};

export const requestAccess = async (email: string) =>
  handleResponse(
    await fetchWithRetry(`${API}/request-access`, {
      method: "POST",
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({ email }),
    })
  );

export const getHistoricalTAO = async (
  days = 30
): Promise<Array<{ date: string; price: number }>> =>
  handleResponse(
    await fetchWithRetry(`${API}/historical/tao?days=${days}`, { headers: DEFAULT_HEADERS })
  );

// ── Authenticated ─────────────────────────────────────────────────────────────

export const getSubnetsDetailed = async (token: string) =>
  handleResponse(
    await fetchWithRetry(`${API}/subnets-detailed`, {
      headers: { ...DEFAULT_HEADERS, ...getAuthHeader(token) },
    })
  );

// ── Admin ─────────────────────────────────────────────────────────────────────

export const approveAccess = async (email: string, token: string) =>
  handleResponse(
    await fetchWithRetry(`${API}/admin/approve-access`, {
      method: "POST",
      headers: { ...DEFAULT_HEADERS, ...getAuthHeader(token) },
      body: JSON.stringify({ email }),
    })
  );

export const getAdminStatus = async (token: string) =>
  handleResponse(
    await fetchWithRetry(`${API}/admin/status`, {
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
