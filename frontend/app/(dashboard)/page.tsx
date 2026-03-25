'use client';
import React, { useState, useEffect } from 'react';
import { fetchStats, fetchSubnets, fetchNews, type Stats, type SubnetRow, type NewsItem } from '@/lib/api';
import '../dashboard.css';

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

/* ── Sidebar Nav Items ─────────────────────────────────────────────── */

const NAV_SECTIONS = [
  {
    title: 'Analytics',
    items: [
      { key: 'overview', label: 'Dashboard', icon: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></> },
      { key: 'subnet', label: 'Subnet Explorer', icon: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="2" x2="12" y2="22"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></> },
      { key: 'valuation', label: 'Valuation Tools', icon: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></> },
      { key: 'portfolio', label: 'Portfolio Analytics', icon: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></> },
      { key: 'taoflow', label: 'TAO Flow & Yield', icon: <><path d="M12 2v20M2 12h20"/><circle cx="12" cy="12" r="3"/><path d="M12 2a10 10 0 0 1 0 20"/></> },
    ],
  },
  {
    title: 'Institutional',
    items: [
      { key: 'signals', label: 'Signals', icon: <><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></> },
      { key: 'onchain', label: 'On-Chain Analytics', icon: <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></> },
      { key: 'reports', label: 'Report Generator', icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></> },
    ],
  },
  {
    title: 'Resources',
    items: [
      { key: 'research', label: 'Research & Insights', icon: <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></> },
      { key: 'glossary', label: 'Glossary', icon: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></> },
      { key: 'news', label: 'Intelligence Feed', icon: <><path d="M13 10V3L4 14h7v7l9-11h-7z"/></> },
    ],
  },
];

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
      {/* ── HEADER ── */}
      <header className="hdr">
        <div className="logo">
          <div className="logo-i" style={{ fontSize: '24px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>τ</div>
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

      {/* ── MAIN ── */}
      <div className="main">
        {/* ── SIDEBAR ── */}
        <aside className="side">
          {NAV_SECTIONS.map((section) => (
            <nav className="nav-s" key={section.title}>
              <div className="nav-hd">{section.title}</div>
              {section.items.map((item) => (
                <a key={item.key} className={`nav-i ${view === item.key ? 'act' : ''}`} onClick={() => setView(item.key)}>
                  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{item.icon}</svg>
                  {item.label}
                </a>
              ))}
            </nav>
          ))}

          {/* Institutional Badge */}
          <div style={{ marginTop: 'auto', padding: 12, background: 'linear-gradient(135deg,rgba(59,130,246,0.1),rgba(139,92,246,0.1))', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, fontSize: 11 }}>
            <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--cyan)' }}>Institutional Access</div>
            <div style={{ color: 'var(--txt2)', marginBottom: 8 }}>SEC-compliant reporting & audit trails</div>
            <div style={{ display: 'flex', gap: 4 }}>
              <span style={{ padding: '2px 6px', background: 'var(--bg4)', borderRadius: 3, fontSize: 9, color: 'var(--green)' }}>SOC 2</span>
              <span style={{ padding: '2px 6px', background: 'var(--bg4)', borderRadius: 3, fontSize: 9, color: 'var(--cyan)' }}>API</span>
            </div>
          </div>
        </aside>

        {/* ── CONTENT ── */}
        <main className="cont">

          {/* ══ OVERVIEW ══ */}
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
                    <div className="price-ch up">{activeSubnets} active subnet{activeSubnets !== 1 ? 's' : ''}</div>
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

          {/* ══ SUBNET EXPLORER ══ */}
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

          {/* ══ VALUATION TOOLS ══ */}
          {view === 'valuation' && (
            <div className="view act">
              <section className="sec">
                <div className="sec-hd">
                  <div>
                    <div className="sec-t">Valuation Metrics Framework</div>
                    <div className="sec-sub">Essential metrics for institutional-grade subnet analysis</div>
                  </div>
                </div>
                <div className="grid-2" style={{ marginBottom: 20 }}>
                  <div style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 10, padding: 20 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: 'var(--cyan)' }}>Alpha/Emissions Ratio (α/EM)</div>
                    <div style={{ fontSize: 13, color: 'var(--txt2)', lineHeight: 1.7 }}>
                      <p>Measures cost efficiency of staking in a subnet. Represents alpha token price relative to emission share.</p>
                      <p style={{ marginTop: 8 }}><strong style={{ color: 'var(--green)' }}>&lt; 0.20:</strong> Undervalued — Strong buy signal</p>
                      <p><strong style={{ color: 'var(--amber)' }}>0.20 - 0.30:</strong> Fair Value</p>
                      <p><strong style={{ color: 'var(--rose)' }}>&gt; 0.30:</strong> Expensive — Premium pricing</p>
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 10, padding: 20 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: 'var(--violet)' }}>Price/Emissions Ratio (P/E)</div>
                    <div style={{ fontSize: 13, color: 'var(--txt2)', lineHeight: 1.7 }}>
                      <p>Adapts traditional P/E analysis for subnet valuation. Market cap relative to annual emission value.</p>
                      <p style={{ marginTop: 8 }}><strong style={{ color: 'var(--green)' }}>&lt; 1.5x:</strong> Attractive</p>
                      <p><strong style={{ color: 'var(--amber)' }}>1.5x - 2.0x:</strong> Fair — Typical range</p>
                      <p><strong style={{ color: 'var(--rose)' }}>&gt; 2.0x:</strong> Growth Premium</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ══ PORTFOLIO ANALYTICS ══ */}
          {view === 'portfolio' && (
            <div className="view act">
              <section className="sec">
                <div className="sec-hd">
                  <div>
                    <div className="sec-t">Portfolio Analytics</div>
                    <div className="sec-sub">Personal staking projections and scenario modeling</div>
                  </div>
                </div>
                <div style={{ textAlign: 'center', padding: 48, color: 'var(--mute)' }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: 'var(--txt)' }}>Portfolio Analytics</div>
                  <div>Connect your wallet or enter holdings to see staking projections, scenario modeling, and rebalancing recommendations.</div>
                </div>
              </section>
            </div>
          )}

          {/* ══ TAO FLOW & YIELD ══ */}
          {view === 'taoflow' && (
            <div className="view act">
              <section className="sec">
                <div className="sec-hd">
                  <div>
                    <div className="sec-t">TAO Flow & Yield Analytics</div>
                    <div className="sec-sub">Network emission mechanics, staking yields, and capital flow analysis</div>
                  </div>
                </div>
                <div className="metric-g">
                  <div className="metric">
                    <div className="metric-hd"><div className="metric-l">Daily TAO Emission</div></div>
                    <div className="metric-v" style={{ color: 'var(--cyan)' }}>3,600 τ</div>
                    <div className="metric-ch" style={{ color: 'var(--mute)' }}>≈ {fmt(3600 * taoPrice)}/day</div>
                  </div>
                  <div className="metric">
                    <div className="metric-hd"><div className="metric-l">Network Staking APY</div></div>
                    <div className="metric-v" style={{ color: 'var(--green)' }}>18.4%</div>
                    <div className="metric-ch up">+2.1% vs 30d avg</div>
                  </div>
                  <div className="metric">
                    <div className="metric-hd"><div className="metric-l">Total Value Staked</div></div>
                    <div className="metric-v">{fmt(marketCap * 0.7)}</div>
                  </div>
                  <div className="metric">
                    <div className="metric-hd"><div className="metric-l">Emission Yield Ratio</div></div>
                    <div className="metric-v" style={{ color: 'var(--green)' }}>0.84x</div>
                    <div className="metric-ch up">Undervalued</div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ══ SIGNALS ══ */}
          {view === 'signals' && (
            <div className="view act">
              <section className="sec" style={{ background: 'transparent', border: 'none', padding: 0 }}>
                <div style={{ marginBottom: 32 }}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Institutional Signals</div>
                  <div style={{ fontSize: 14, color: 'var(--mute)' }}>Medium to long-term allocation recommendations based on fundamental analysis</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 32 }}>
                  {[
                    { label: 'CONVICTION BUYS', val: '4', color: 'var(--green)', sub: 'High confidence' },
                    { label: 'ACCUMULATE', val: '6', color: 'var(--cyan)', sub: 'Build positions' },
                    { label: 'HOLD', val: '12', color: 'var(--amber)', sub: 'Maintain exposure' },
                    { label: 'REDUCE', val: '2', color: 'var(--rose)', sub: 'Trim overweight' },
                  ].map((s) => (
                    <div key={s.label} style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 12, padding: 20, borderTop: `3px solid ${s.color}` }}>
                      <div style={{ fontSize: 10, color: 'var(--mute)', letterSpacing: '0.1em', marginBottom: 8 }}>{s.label}</div>
                      <div style={{ fontSize: 32, fontWeight: 700, color: s.color, fontFamily: "'IBM Plex Mono',monospace" }}>{s.val}</div>
                      <div style={{ fontSize: 11, color: 'var(--txt2)', marginTop: 4 }}>{s.sub}</div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* ══ ON-CHAIN ══ */}
          {view === 'onchain' && (
            <div className="view act">
              <section className="sec">
                <div className="sec-hd">
                  <div>
                    <div className="sec-t">TAO On-Chain Intelligence</div>
                    <div className="sec-sub">MVRV Z-Score · RVT Ratio · NUPL · Live Data from taostats.io</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                  {[
                    { label: '⬡ MVRV Z-Score', val: '−0.38', color: 'var(--cyan)', zone: 'Hope / Recovery Zone' },
                    { label: '⬡ RVT Ratio', val: '31.2', color: 'var(--amber)', zone: 'Moderate — Watch' },
                    { label: '⬡ NUPL', val: '0.09', color: 'var(--green)', zone: 'Hope / Recovery' },
                  ].map((m) => (
                    <div key={m.label} style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 10, padding: 20, borderTop: `3px solid ${m.color}` }}>
                      <div style={{ fontSize: 10, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{m.label}</div>
                      <div style={{ fontSize: 32, fontWeight: 800, color: m.color, fontFamily: "'IBM Plex Mono',monospace" }}>{m.val}</div>
                      <div style={{ display: 'inline-block', padding: '3px 8px', background: 'rgba(255,214,10,0.12)', border: '1px solid rgba(255,214,10,0.3)', borderRadius: 4, fontSize: 10, fontWeight: 600, color: 'var(--amber)', margin: '8px 0' }}>{m.zone}</div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* ══ REPORTS ══ */}
          {view === 'reports' && (
            <div className="view act">
              <section className="sec">
                <div className="sec-hd">
                  <div>
                    <div className="sec-t">Report Generator</div>
                    <div className="sec-sub">Generate institutional-grade research reports</div>
                  </div>
                </div>
                <div style={{ textAlign: 'center', padding: 48, color: 'var(--mute)' }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📄</div>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: 'var(--txt)' }}>Report Generator</div>
                  <div>One-click generation of LP-ready research reports with subnet valuation, risk scoring, and allocation recommendations.</div>
                  <button className="btn btn-p" style={{ marginTop: 20 }}>Generate Report</button>
                </div>
              </section>
            </div>
          )}

          {/* ══ RESEARCH ══ */}
          {view === 'research' && (
            <div className="view act">
              <section className="sec">
                <div className="sec-hd">
                  <div>
                    <div className="sec-t">Latest Research & Reports</div>
                    <div className="sec-sub">In-depth analysis and market insights</div>
                  </div>
                </div>
                <div style={{ textAlign: 'center', padding: 48, color: 'var(--mute)' }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📚</div>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: 'var(--txt)' }}>Research Hub</div>
                  <div>Deep dives on subnet ecosystem, macro trends, and institutional analysis coming soon.</div>
                </div>
              </section>
            </div>
          )}

          {/* ══ GLOSSARY ══ */}
          {view === 'glossary' && (
            <div className="view act">
              <section className="sec">
                <div className="sec-hd">
                  <div>
                    <div className="sec-t">Investment Glossary</div>
                    <div className="sec-sub">Definitions and formulas for all quantitative metrics</div>
                  </div>
                </div>
                <div className="grid-2">
                  <div style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 10, padding: 20 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--cyan)', marginBottom: 16 }}>Valuation Metrics</div>
                    {[
                      { term: 'Alpha Price (α)', def: 'Price of one subnet token in TAO. Lower alpha with high emissions = undervalued.' },
                      { term: 'α/EM Ratio', def: 'Alpha Price / Emission Share %. Lower = more undervalued.' },
                      { term: 'P/E Ratio', def: 'Market Cap / Annual Emission Value. Lower = cheaper relative to earnings.' },
                      { term: 'TANAV', def: 'TAO-Adjusted Net Asset Value. Fair value based on staked TAO and emission rights.' },
                    ].map((g) => (
                      <div className="gloss-item" key={g.term}>
                        <div className="gloss-term">{g.term}</div>
                        <div className="gloss-def">{g.def}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: 'var(--bg3)', border: '1px solid var(--bdr)', borderRadius: 10, padding: 20 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--rose)', marginBottom: 16 }}>Risk Metrics</div>
                    {[
                      { term: 'Sharpe Ratio', def: 'Risk-adjusted return. Excess return per unit of volatility. >1.0 good, >2.0 excellent.' },
                      { term: 'Sortino Ratio', def: 'Like Sharpe but only penalizes downside volatility. Higher = better downside protection.' },
                      { term: 'VaR (95%)', def: 'Value at Risk. Maximum expected 1-day loss at 95% confidence.' },
                      { term: 'Max Drawdown', def: 'Largest peak-to-trough decline. Key metric for fund managers.' },
                    ].map((g) => (
                      <div className="gloss-item" key={g.term}>
                        <div className="gloss-term">{g.term}</div>
                        <div className="gloss-def">{g.def}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ══ NEWS / INTELLIGENCE FEED ══ */}
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
