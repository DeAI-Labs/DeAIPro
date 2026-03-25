/**
 * Next.js API client for DeAI backend
 *
 * Uses NEXT_PUBLIC_API_URL from .env.local / Vercel env vars.
 * All functions return typed data matching backend responses.
 */

const API_BASE =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) ||
  'https://deai-kyzf.onrender.com';

const API = `${API_BASE}/api`;

/* ── helpers ──────────────────────────────────────────────────────────── */

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    next: { revalidate: 30 },          // ISR: cache for 30 s on the server
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  const body = await res.json();
  // unwrap the { status, data } envelope the Beanie routes use
  return body.data !== undefined ? body.data : body;
}

/* ── types ─────────────────────────────────────────────────────────── */

export interface Stats {
  tao_price: number;
  tao_price_btc: number;
  market_cap: number;
  volume_24h: number;
  tao_price_change_24h: number;
  volume_change_24h: number;
  active_subnets: number;
  sum_alpha_mc: number;
  total_ecosystem_mc: number;
  source: string;
  timestamp: string;
}

export interface SubnetRow {
  id: number;
  n: string;
  cat: string;
  mc: number;
  em: number;
  apy: number;
  val: number;
  trend: string;
  score: number;
  alpha: number;
  live: boolean;
  // optional dynamic fields from TaoStats
  emission_tao?: number;
  emission_share_pct?: number;
  alpha_price_tao?: number;
  validator_count?: number;
  miner_count?: number;
}

export interface NewsItem {
  title: string;
  url: string;
  source: string;
  category: string;
  timestamp?: string;
  content_excerpt?: string;
  published_at?: string;
  relevance_score?: number;
}

export interface SentimentData {
  score: number;
  label: string;
  components: Record<string, number>;
  timestamp: string;
}

/* ── public endpoints ─────────────────────────────────────────────── */

export async function fetchStats(): Promise<Stats> {
  return json<Stats>(`${API}/stats`);
}

export async function fetchSubnets(): Promise<SubnetRow[]> {
  const raw = await json<any[]>(`${API}/subnets`);
  if (!Array.isArray(raw)) return [];
  return raw.map((s) => ({
    id: s.id,
    n: s.name || s.n || `Subnet ${s.id}`,
    cat: s.category || s.cat || 'General',
    mc: s.market_cap_millions || s.mc || 0,
    em: s.daily_emission || s.em || 0,
    apy: s.apy || 0,
    val: s.validators_count || s.val || 0,
    trend: s.trend || 'up',
    score: s.quality_score || s.score || 80,
    alpha: s.alpha_price_tao || s.alpha || 0,
    live: !!s.live,
    emission_tao: s.emission_tao,
    emission_share_pct: s.emission_share_pct,
    alpha_price_tao: s.alpha_price_tao,
    validator_count: s.validator_count,
    miner_count: s.miner_count,
  }));
}

export async function fetchNews(): Promise<NewsItem[]> {
  const raw = await json<any[]>(`${API}/news`);
  if (!Array.isArray(raw)) return [];
  return raw.map((n) => ({
    title: n.title,
    url: n.url || '#',
    source: n.source || 'News',
    category: n.category || 'General',
    timestamp: n.timestamp,
    content_excerpt: n.content_excerpt,
    published_at: n.published_at,
    relevance_score: n.relevance_score,
  }));
}

export async function fetchSentiment(): Promise<SentimentData | null> {
  try {
    return await json<SentimentData>(`${API}/market/sentiment`);
  } catch {
    return null;
  }
}

export async function fetchHealth(): Promise<{ status: string }> {
  return json<{ status: string }>(`${API}/health`);
}
