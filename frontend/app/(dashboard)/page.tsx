'use client';
import React, { useState, useEffect } from 'react';
import { fetchStats, fetchSubnets, fetchNews, type Stats, type SubnetRow, type NewsItem } from '@/lib/api';

function fmt(n: number, prefix = '$'): string {
  if (n >= 1e9) return `${prefix}${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${prefix}${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${prefix}${(n / 1e3).toFixed(1)}K`;
  return `${prefix}${n.toFixed(2)}`;
}

function grade(score: number): { letter: string; cls: string } {
  if (score >= 85) return { letter: 'A', cls: 'grade-a' };
  if (score >= 70) return { letter: 'B', cls: 'grade-b' };
  if (score >= 50) return { letter: 'C', cls: 'grade-c' };
  return { letter: 'D', cls: 'grade-d' };
}

export default function DashboardPage() {
  const [view, setView] = useState('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [subnets, setSubnets] = useState<SubnetRow[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, sn, n] = await Promise.all([
          fetchStats().catch(() => null),
          fetchSubnets().catch(() => []),
          fetchNews().catch(() => []),
        ]);
        if (s) setStats(s);
        setSubnets(sn);
        setNews(n);
      } finally {
        setLoading(false);
      }
    }
    load();
    // Refresh every 60s
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  const taoPrice = stats?.tao_price ?? 0;
  const taoPriceChange = stats?.tao_price_change_24h ?? 0;
  const marketCap = stats?.market_cap ?? 0;
  const volume24h = stats?.volume_24h ?? 0;
  const activeSubnets = stats?.active_subnets ?? 0;
  const sumAlphaMc = stats?.sum_alpha_mc ?? 0;
  const totalEcoMc = stats?.total_ecosystem_mc ?? 0;

  return (
    <>
      <header className="hdr">
        <div className="logo">
          <div className="logo-i" style={{ fontSize: '24px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
            τ
          </div>
          <div>
            <div className="logo-t">DeAI <span>Nexus</span></div>
            <div className="logo-s">Bittensor Intelligence</div>
          </div>
        </div>
        <div className="ticker-container">
          <div className="ticker">
            {subnets.slice(0, 8).map((s) => (
              <div className="ticker-item" key={s.id}>
                <span className="ticker-name">SN{s.id}</span>
                <span className="ticker-val" style={{ color: s.trend === 'up' ? 'var(--green)' : 'var(--rose)' }}>
                  {s.n} {s.alpha ? `α${s.alpha.toFixed(4)}` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="hdr-c">
          <div className="stat">
            <div>
              <div className="stat-l">TAO Price</div>
              <div className="stat-v">{loading ? '...' : `$${taoPrice.toFixed(2)}`}</div>
            </div>
            <div className={`stat-ch ${taoPriceChange >= 0 ? 'up' : 'dn'}`}>
              {taoPriceChange >= 0 ? '+' : ''}{taoPriceChange.toFixed(1)}%
            </div>
          </div>
          <div className="stat">
            <div>
              <div className="stat-l">Network Cap</div>
              <div className="stat-v">{loading ? '...' : fmt(marketCap)}</div>
            </div>
          </div>
          <div className="stat">
            <div>
              <div className="stat-l">24h Volume</div>
              <div className="stat-v">{loading ? '...' : fmt(volume24h)}</div>
            </div>
          </div>
        </div>
        <div className="hdr-r">
          <div className="live">
            <div className="live-d"></div>
            <span>{stats?.source === 'coingecko' ? 'LIVE' : stats?.source ?? 'LIVE'}</span>
          </div>
        </div>
      </header>

      <div className="main">
        <aside className="side">
          <nav className="nav-s">
            <div className="nav-hd">Analytics</div>
            {[
              { key: 'overview', label: 'Dashboard', icon: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></> },
              { key: 'subnet', label: 'Subnet Explorer', icon: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="2" x2="12" y2="22"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></> },
              { key: 'news', label: 'Intelligence Feed', icon: <><path d="M13 10V3L4 14h7v7l9-11h-7z"/></> },
            ].map((item) => (
              <a key={item.key} className={`nav-i ${view === item.key ? 'act' : ''}`} onClick={() => setView(item.key)}>
                <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{item.icon}</svg>
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        <main className="cont">
          {/* ── OVERVIEW ── */}
          {view === 'overview' && (
            <div className="view act">
              <div className="grid-2" style={{ marginBottom: 20 }}>
                <div className="price-box">
                  <div className="price-icon">τ</div>
                  <div className="price-info">
                    <div className="price-l">TAO Price</div>
                    <div className="price-v">{loading ? '...' : `$${taoPrice.toFixed(2)}`}</div>
                    <div className={`price-ch ${taoPriceChange >= 0 ? 'up' : 'dn'}`}>
                      {taoPriceChange >= 0 ? '+' : ''}{taoPriceChange.toFixed(1)}% (24h)
                    </div>
                  </div>
                </div>
                <div className="price-box">
                  <div className="price-icon">α</div>
                  <div className="price-info">
                    <div className="price-l">Ecosystem Market Cap</div>
                    <div className="price-v">{loading ? '...' : fmt(totalEcoMc * 1e6)}</div>
                    <div className="price-ch up">
                      {activeSubnets} active subnet{activeSubnets !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>

              <section className="sec">
                <div className="sec-hd">
                  <div>
                    <div className="sec-t">Network Overview</div>
                    <div className="sec-sub">Real-time Bittensor ecosystem metrics{stats?.source ? ` · ${stats.source}` : ''}</div>
                  </div>
                </div>
                <div className="metric-g">
                  <div className="metric">
                    <div className="metric-hd"><div className="metric-l">Total Market Cap</div></div>
                    <div className="metric-v">{loading ? '...' : fmt(marketCap)}</div>
                  </div>
                  <div className="metric">
                    <div className="metric-hd"><div className="metric-l">Active Subnets</div></div>
                    <div className="metric-v">{loading ? '...' : activeSubnets}</div>
                  </div>
                  <div className="metric">
                    <div className="metric-hd"><div className="metric-l">24h Volume</div></div>
                    <div className="metric-v">{loading ? '...' : fmt(volume24h)}</div>
                  </div>
                  <div className="metric">
                    <div className="metric-hd"><div className="metric-l">Sum Alpha MC</div></div>
                    <div className="metric-v">{loading ? '...' : fmt(sumAlphaMc * 1e6)}</div>
                  </div>
                </div>
              </section>

              {/* Top Subnets Preview */}
              <section className="sec">
                <div className="sec-hd">
                  <div>
                    <div className="sec-t">Top Subnets</div>
                    <div className="sec-sub">Top 5 subnets by market cap</div>
                  </div>
                  <div className="sec-act">
                    <button className="btn btn-g" onClick={() => setView('subnet')}>View All →</button>
                  </div>
                </div>
                <table className="tbl">
                  <thead><tr><th>#</th><th>Subnet</th><th>Grade</th><th>Market Cap</th><th>APY</th><th>Validators</th></tr></thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--mute)' }}>Loading live data…</td></tr>
                    ) : subnets.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--mute)' }}>No subnet data available</td></tr>
                    ) : subnets.slice(0, 5).map((s, i) => {
                      const g = grade(s.score);
                      return (
                        <tr key={s.id}>
                          <td className="rank">{i + 1}</td>
                          <td className="n">{s.n}</td>
                          <td><span className={`grade ${g.cls}`}>{g.letter}</span></td>
                          <td className="val">{fmt(s.mc * 1e6)}</td>
                          <td className="val">{s.apy ? `${s.apy.toFixed(1)}%` : '—'}</td>
                          <td className="val">{s.val || s.validator_count || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>
            </div>
          )}

          {/* ── SUBNET EXPLORER ── */}
          {view === 'subnet' && (
            <div className="view act">
              <section className="sec">
                <div className="sec-hd">
                  <div>
                    <div className="sec-t">Subnet Explorer</div>
                    <div className="sec-sub">{subnets.length} subnets · Live data from TaoStats</div>
                  </div>
                </div>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>#</th><th>ID</th><th>Subnet</th><th>Grade</th><th>Score</th>
                      <th>Alpha τ</th><th>Market Cap</th><th>EM %</th><th>APY</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32, color: 'var(--mute)' }}>Loading subnets…</td></tr>
                    ) : subnets.map((s, i) => {
                      const g = grade(s.score);
                      return (
                        <tr key={s.id}>
                          <td className="rank">{i + 1}</td>
                          <td className="val">SN{s.id}</td>
                          <td className="n">{s.n}</td>
                          <td><span className={`grade ${g.cls}`}>{g.letter}</span></td>
                          <td className="val">{s.score}</td>
                          <td className="val">{s.alpha_price_tao?.toFixed(4) ?? s.alpha?.toFixed(4) ?? '—'}</td>
                          <td className="val">{fmt(s.mc * 1e6)}</td>
                          <td className="val">{s.emission_share_pct?.toFixed(2) ?? s.em?.toFixed(2) ?? '—'}%</td>
                          <td className="val">{s.apy ? `${s.apy.toFixed(1)}%` : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>
            </div>
          )}

          {/* ── NEWS FEED ── */}
          {view === 'news' && (
            <div className="view act">
              <section className="sec">
                <div className="sec-hd">
                  <div>
                    <div className="sec-t">Intelligence Feed</div>
                    <div className="sec-sub">Live news from the Bittensor ecosystem</div>
                  </div>
                </div>
                <div className="news-g">
                  {loading ? (
                    <div style={{ padding: 32, color: 'var(--mute)', textAlign: 'center' }}>Loading news…</div>
                  ) : news.length === 0 ? (
                    <div style={{ padding: 32, color: 'var(--mute)', textAlign: 'center' }}>No news available</div>
                  ) : news.map((n, i) => (
                    <a key={i} className="news-c" href={n.url} target="_blank" rel="noopener noreferrer">
                      <div className="news-tag">{n.category}</div>
                      <div className="news-t">{n.title}</div>
                      <div className="news-meta">
                        <span>{n.source}</span>
                        <span>{n.timestamp || n.published_at || 'Recent'}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
