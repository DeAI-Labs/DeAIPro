'use client';
import React, { useEffect, useRef, useState } from 'react';
import './landing.css';
import { fetchStats, fetchNews, type Stats, type NewsItem } from '@/lib/api';

function fmt(n: number, prefix = '$'): string {
  if (n >= 1e9) return `${prefix}${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${prefix}${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${prefix}${(n / 1e3).toFixed(1)}K`;
  return `${prefix}${n.toFixed(2)}`;
}

export default function LandingPage() {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    async function load() {
      const [s, n] = await Promise.all([
        fetchStats().catch(() => null),
        fetchNews().catch(() => []),
      ]);
      if (s) setStats(s);
      setNews(n);
    }
    load();
  }, []);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('lp-vis');
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.lp-fi').forEach((el) => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  const taoPrice = stats?.tao_price ?? 0;
  const taoPriceChg = stats?.tao_price_change_24h ?? 0;
  const volume24h = stats?.volume_24h ?? 0;
  const activeSubnets = stats?.active_subnets ?? 0;
  const marketCap = stats?.market_cap ?? 0;

  const tickerItems = [
    { sym: 'TAO', val: taoPrice ? `$${taoPrice.toFixed(2)} ${taoPriceChg >= 0 ? '▲' : '▼'}${Math.abs(taoPriceChg).toFixed(1)}%` : '...', cls: taoPriceChg >= 0 ? 'lp-up' : 'lp-dn' },
    { sym: 'MCAP', val: marketCap ? fmt(marketCap) : '...', cls: '' },
    { sym: 'VOL', val: volume24h ? fmt(volume24h) : '...', cls: 'lp-up' },
    { sym: 'SUBNETS', val: `${activeSubnets}`, cls: 'lp-up' },
    { sym: 'TAO/BTC', val: stats?.tao_price_btc ? `${stats.tao_price_btc.toFixed(6)}` : '...', cls: 'lp-up' },
    { sym: 'ECO MC', val: stats?.total_ecosystem_mc ? fmt(stats.total_ecosystem_mc * 1e6) : '...', cls: '' },
  ];

  const capabilities = [
    ['Portfolio Optimization', true, false, false],
    ['Efficient Frontier Analysis', true, false, false],
    ['Multi-Dimensional Risk Scoring', true, false, false],
    ['Institutional Report Generator', true, false, false],
    ['Real-Time Price Data', true, true, false],
    ['Sharpe & Beta Calculations', true, false, true],
    ['Valuation Models (RVT, P/E)', true, false, false],
    ['Code Quality Metrics', true, false, true],
    ['Bittensor-Native Focus', true, true, false],
    ['Regulated Canadian MSB Framework', true, false, false],
  ];

  return (
    <div className="landing-page">
      {/* TICKER */}
      <div className="lp-ticker-wrap">
        <div className="lp-ticker-track">
          {[...tickerItems, ...tickerItems].map((t, i) => (
            <span className="lp-tick" key={i}>
              <span className="sym">{t.sym}</span>
              <span className={t.cls}>{t.val}</span>
            </span>
          ))}
        </div>
      </div>

      {/* NAV */}
      <nav className="lp-nav">
        <div className="lp-logo">
          <div className="lp-logo-mark">
            <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
              <polygon points="9,1.5 16.5,5.5 16.5,12.5 9,16.5 1.5,12.5 1.5,5.5" stroke="white" strokeWidth="1.5" fill="none"/>
              <circle cx="9" cy="9" r="2.4" fill="white"/>
            </svg>
          </div>
          <div className="lp-logo-name">DeAI <span>Strategies</span></div>
        </div>
        <ul>
          <li><a href="#">Platform</a></li>
          <li><a href="#">Subnets</a></li>
          <li><a href="#">Research</a></li>
          <li><a href="#">Institutional</a></li>
        </ul>
        <div className="lp-nav-btns">
          <button className="lp-btn-ghost">Sign In</button>
          <button className="lp-btn-primary">Request Access</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-hero-grid">
          <div>
            <div className="lp-eyebrow lp-fi lp-d1"><span className="lp-dot"></span>Intelligence Capital Markets</div>
            <h1 className="lp-fi lp-d2">The Private Terminal<br/>for the <em>Decentralized<br/>AI Economy.</em></h1>
            <p className="lp-hero-sub lp-fi lp-d3">Institutional-grade intelligence for allocating capital across Bittensor subnets. Real-time feeds, portfolio analytics, and AI-generated research — all in one regulated platform.</p>
            <div className="lp-hero-cta lp-fi lp-d4">
              <button className="lp-btn-primary lp-btn-lg">Request Institutional Access</button>
              <button className="lp-btn-ghost lp-btn-lg">View Demo</button>
            </div>
            <div className="lp-hero-stats lp-fi lp-d4">
              <div><div className="lp-hs-val">{marketCap ? fmt(marketCap) : '...'}</div><div className="lp-hs-label">Market Cap</div></div>
              <div><div className="lp-hs-val">{volume24h ? fmt(volume24h) : '...'}</div><div className="lp-hs-label">24h Volume</div></div>
              <div><div className="lp-hs-val">{activeSubnets || '...'}</div><div className="lp-hs-label">Subnets</div></div>
              <div><div className="lp-hs-val">{taoPrice ? `$${taoPrice.toFixed(0)}` : '...'}</div><div className="lp-hs-label">TAO Price</div></div>
            </div>
          </div>
          {/* HERO CARD */}
          <div className="lp-hero-card lp-fi lp-d3">
            <div className="lp-hc-top">
              <div className="lp-hc-dots"><span className="lp-d-r"></span><span className="lp-d-y"></span><span className="lp-d-g"></span></div>
              <div className="lp-hc-tag">INTELLIGENCE FEED · LIVE</div>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 8px var(--green)', animation: 'lp-pulse 2s infinite' }}></div>
            </div>
            <div className="lp-hc-body">
              <div className="lp-hc-stitle">Breaking Intelligence</div>
              <div className="lp-news-feed">
                <div className="lp-ni">
                  <div className="lp-ni-time">2m</div>
                  <div><div className="lp-ni-tag">MACRO</div><div className="lp-ni-text">Fed signals pause — DeAI subnets outperforming benchmark by +4.2%.</div></div>
                </div>
                <div className="lp-ni" style={{ borderColor: 'var(--cyan)' }}>
                  <div className="lp-ni-time">9m</div>
                  <div><div className="lp-ni-tag" style={{ background: 'rgba(34,211,238,0.1)', color: 'var(--cyan)' }}>SUBNET</div><div className="lp-ni-text">SN22 Audio hits 6-month high emission rate. Validator Gini at 0.34.</div></div>
                </div>
                <div className="lp-ni" style={{ borderColor: 'var(--amber)' }}>
                  <div className="lp-ni-time">14m</div>
                  <div><div className="lp-ni-tag" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--amber)' }}>REPORT</div><div className="lp-ni-text">Q1 Subnet Risk Score Analysis generated — available for download.</div></div>
                </div>
              </div>
              <div className="lp-hc-stitle">Portfolio Alpha</div>
              <div className="lp-mc-wrap">
                <div className="lp-mc-head"><span className="lp-mc-name">Subnet Allocation</span><span className="lp-mc-val">+24.8% YTD</span></div>
                <div style={{ height: 65, background: 'linear-gradient(180deg, rgba(91,94,244,0.15) 0%, transparent 100%)', borderRadius: 6 }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="lp-divider" />

      {/* FEATURES */}
      <div className="lp-sec">
        <div style={{ textAlign: 'center', marginBottom: 56 }} className="lp-fi">
          <div className="lp-sec-eye">Platform Capabilities</div>
          <div className="lp-sec-title">Everything you need.<br/>Nothing you don&apos;t.</div>
        </div>
        <div className="lp-feat-grid lp-fi">
          <div className="lp-feat">
            <div className="lp-feat-num">01</div>
            <div className="lp-feat-icon">
              <svg width="19" height="19" fill="none" stroke="var(--vi)" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            </div>
            <div className="lp-feat-title">Portfolio Optimization</div>
            <div className="lp-feat-desc">Mean-variance efficient frontier construction across all active Bittensor subnets with automated rebalancing signals and risk-adjusted alpha scoring.</div>
          </div>
          <div className="lp-feat">
            <div className="lp-feat-num">02</div>
            <div className="lp-feat-icon">
              <svg width="19" height="19" fill="none" stroke="var(--vi)" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <div className="lp-feat-title">Live Intelligence Feed</div>
            <div className="lp-feat-desc">Up-to-the-minute news, macro signals, and subnet-specific events — AI-curated and ranked by portfolio impact so you never miss a move.</div>
          </div>
          <div className="lp-feat">
            <div className="lp-feat-num">03</div>
            <div className="lp-feat-icon">
              <svg width="19" height="19" fill="none" stroke="var(--vi)" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
            <div className="lp-feat-title">Institutional Reports</div>
            <div className="lp-feat-desc">One-click generation of LP-ready research reports with deep dives on subnet valuation, risk scoring, emission dynamics, and allocation recommendations.</div>
          </div>
        </div>
      </div>

      <hr className="lp-divider" />

      {/* REPORT GENERATOR */}
      <div className="lp-sec">
        <div className="lp-report-grid">
          <div className="lp-fi">
            <div className="lp-sec-eye">Institutional Report Generator</div>
            <div className="lp-sec-title">Publish-ready research in <em style={{ fontStyle: 'italic', color: 'var(--vi)' }}>seconds.</em></div>
            <p className="lp-sec-sub" style={{ marginBottom: 38 }}>Our AI engine synthesizes on-chain data, subnet metrics, valuation models, and macro context into comprehensive LP-grade research documents — on demand.</p>
            <div className="lp-rf-list">
              <div className="lp-rf-item"><div className="lp-rf-badge">RVT</div><div><div className="lp-rf-title">Valuation Models (RVT, P/E)</div><div className="lp-rf-desc">Relative Value to Token and Price-to-Emissions ratios across all subnets in real time.</div></div></div>
              <div className="lp-rf-item"><div className="lp-rf-badge">β</div><div><div className="lp-rf-title">Sharpe & Beta Calculations</div><div className="lp-rf-desc">Risk-adjusted return metrics benchmarked against TAO index and broader DeFi baselines.</div></div></div>
              <div className="lp-rf-item"><div className="lp-rf-badge">QC</div><div><div className="lp-rf-title">Code Quality Metrics</div><div className="lp-rf-desc">Automated validator and miner code quality scoring — a proprietary signal no other platform offers.</div></div></div>
            </div>
          </div>
          <div className="lp-rp-card lp-fi lp-d2">
            <div className="lp-rp-hdr">
              <div className="lp-rp-hdr-title">📄 Institutional Report</div>
              <div className="lp-rp-status"><div className="lp-rp-status-dot"></div>GENERATED 0:32s AGO</div>
            </div>
            <div className="lp-rp-body">
              <div className="lp-rp-title">Bittensor Subnet Intelligence<br/>Q1 2026 — Risk Score Analysis</div>
              <div className="lp-rp-date">FEB 22, 2026 · Confidential — Institutional</div>
              <div className="lp-rp-metrics">
                <div className="lp-rp-m"><div className="lp-rp-m-label">Sharpe</div><div className="lp-rp-m-val">2.18</div><div className="lp-rp-m-chg lp-up">▲ 0.14 MoM</div></div>
                <div className="lp-rp-m"><div className="lp-rp-m-label">Avg APY</div><div className="lp-rp-m-val">24.8%</div><div className="lp-rp-m-chg lp-up">▲ 3.2%</div></div>
                <div className="lp-rp-m"><div className="lp-rp-m-label">Risk Vol</div><div className="lp-rp-m-val">0.42</div><div className="lp-rp-m-chg lp-dn">▼ 0.06</div></div>
              </div>
              <div className="lp-rp-excerpt"><strong>Executive Summary:</strong> Q1 2026 marks a structural inflection in Bittensor subnet maturity. SN22 Audio and SN1 Prediction demonstrate superior risk-adjusted returns, with RVT multiples compressing toward fair value. <strong>Code quality metrics</strong> improved 18% QoQ…</div>
              <div className="lp-rp-actions">
                <button className="lp-rp-btn lp-rp-btn-p">Export PDF</button>
                <button className="lp-rp-btn lp-rp-btn-g">Share</button>
                <button className="lp-rp-btn lp-rp-btn-g">Regenerate</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <hr className="lp-divider" />

      {/* LIVE NEWS */}
      <div className="lp-sec lp-fi">
        <div style={{ marginBottom: 44 }}>
          <div className="lp-sec-eye">Intelligence Feed</div>
          <div className="lp-sec-title">Up to the minute.<br/>Always on.</div>
          <p className="lp-sec-sub">Real-time news, macro signals, and subnet events curated by AI and ranked by portfolio impact.</p>
        </div>
        <div className="lp-news-layout">
          <div className="lp-news-stream">
            <div className="lp-ns-hdr">
              <div className="lp-ns-hdr-title">Live Intelligence Feed</div>
              <div className="lp-live-badge"><span className="lp-live-dot"></span>Live</div>
            </div>
            <div>
              {news.length > 0 ? news.slice(0, 5).map((item, i) => {
                const catCls = item.category?.toLowerCase() === 'macro' ? 'lp-c-macro'
                  : item.category?.toLowerCase() === 'subnet' || item.category?.toLowerCase() === 'ecosystem' ? 'lp-c-subnet'
                  : item.category?.toLowerCase() === 'ai' ? 'lp-c-ai'
                  : 'lp-c-defi';
                return (
                  <a className="lp-ns-item" key={i} href={item.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="lp-ns-top"><span className={`lp-ns-cat ${catCls}`}>{item.category}</span><span className="lp-ns-time">{item.timestamp || item.published_at || 'Recent'}</span></div>
                    <div className="lp-ns-headline">{item.title}</div>
                    <div className="lp-impact">
                      <span>{item.source}</span>
                    </div>
                  </a>
                );
              }) : (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--dim)' }}>Loading intelligence feed…</div>
              )}
            </div>
          </div>
          <div className="lp-sig-panel">
            <div className="lp-sig-card">
              <div className="lp-sig-card-title">Active Signals</div>
              <div>
                {[
                  { name: 'SN1 Prediction', meta: '12.4% APY · Low Vol', val: '+12.4%', valColor: 'var(--green)', badge: 'BUY', badgeCls: 'lp-sb-buy' },
                  { name: 'SN22 Audio', meta: '19.7% APY · Med Vol', val: '+19.7%', valColor: 'var(--green)', badge: 'BUY', badgeCls: 'lp-sb-buy' },
                  { name: 'SN18 Compute', meta: '8.1% APY · Low Vol', val: '+8.1%', valColor: 'var(--vi)', badge: 'HOLD', badgeCls: 'lp-sb-hold' },
                  { name: 'SN9 Vision', meta: '14.2% APY · Med Vol', val: '+14.2%', valColor: 'var(--amber)', badge: 'WATCH', badgeCls: 'lp-sb-watch' },
                ].map((s, i) => (
                  <div className="lp-sig-row" key={i}>
                    <div><div className="lp-sig-name">{s.name}</div><div className="lp-sig-meta">{s.meta}</div></div>
                    <div style={{ textAlign: 'right' }}><div className="lp-sig-val" style={{ color: s.valColor }}>{s.val}</div><div className={`lp-sig-badge ${s.badgeCls}`}>{s.badge}</div></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lp-sig-card">
              <div className="lp-sig-card-title">Market Pulse</div>
              <div>
                {[
                  { name: 'TAO / USD', val: taoPrice ? `$${taoPrice.toFixed(2)} ${taoPriceChg >= 0 ? '▲' : '▼'}${Math.abs(taoPriceChg).toFixed(1)}%` : '...', color: taoPriceChg >= 0 ? 'var(--green)' : 'var(--red)' },
                  { name: 'Market Cap', val: marketCap ? fmt(marketCap) : '...', color: 'var(--text)' },
                  { name: 'Active Subnets', val: `${activeSubnets || '...'}`, color: 'var(--text)' },
                  { name: '24h Volume', val: volume24h ? fmt(volume24h) : '...', color: 'var(--green)' },
                ].map((m, i) => (
                  <div className="lp-sig-row" key={i}>
                    <div className="lp-sig-name">{m.name}</div>
                    <div className="lp-sig-val" style={{ color: m.color }}>{m.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <hr className="lp-divider" />

      {/* COMPARISON */}
      <div className="lp-sec lp-fi">
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div className="lp-sec-eye">Competitive Intelligence</div>
          <div className="lp-sec-title">No other platform<br/>comes close.</div>
        </div>
        <div className="lp-comp-card">
          <div className="lp-comp-hdr">
            <div>
              <div className="lp-comp-hdr-title">Capability Comparison</div>
              <div className="lp-comp-hdr-sub">Bittensor Intelligence vs. existing market alternatives</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Capability</th>
                <th className="lp-feat-col">Bittensor Intelligence</th>
                <th className="lp-other">TaoStats</th>
                <th className="lp-other">Nansen</th>
              </tr>
            </thead>
            <tbody>
              {capabilities.map(([name, bi, ts, na], i) => (
                <tr key={i}>
                  <td>{name as string}</td>
                  <td className="lp-feat-col">{bi ? <span className="lp-chk">✓</span> : <span className="lp-dsh">—</span>}</td>
                  <td className="lp-other">{ts ? <span className="lp-chk">✓</span> : <span className="lp-dsh">—</span>}</td>
                  <td className="lp-other">{na ? <span className="lp-chk">✓</span> : <span className="lp-dsh">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <hr className="lp-divider" />

      {/* CTA */}
      <div className="lp-sec lp-fi">
        <div className="lp-cta-wrap">
          <div className="lp-sec-eye" style={{ marginBottom: 18 }}>Get Started Today</div>
          <div className="lp-cta-title">The edge is<br/><em>already live.</em></div>
          <p className="lp-cta-sub">Join institutions allocating intelligently in the decentralized AI economy. Request full platform access.</p>
          <div className="lp-cta-btns">
            <button className="lp-btn-primary lp-btn-lg">Request Institutional Access</button>
            <button className="lp-btn-ghost lp-btn-lg">Schedule a Demo</button>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div>
          <div className="lp-logo">
            <div className="lp-logo-mark" style={{ width: 28, height: 28 }}>
              <svg width="13" height="13" viewBox="0 0 18 18" fill="none"><polygon points="9,1.5 16.5,5.5 16.5,12.5 9,16.5 1.5,12.5 1.5,5.5" stroke="white" strokeWidth="1.5" fill="none"/><circle cx="9" cy="9" r="2.4" fill="white"/></svg>
            </div>
            <div className="lp-logo-name" style={{ fontSize: 15 }}>DeAI <span>Strategies</span></div>
          </div>
          <div className="lp-foot-copy">© 2026 DeAI Strategies Corp. All Rights Reserved.<br/>Regulated under Canadian MSB Framework. SOC-2 Compliant.</div>
        </div>
        <div className="lp-foot-cols">
          <div className="lp-fc"><span className="lp-fc-head">Platform</span><a href="#">Terminal</a><a href="#">Subnets</a><a href="#">Risk Engine</a><a href="#">Reports</a></div>
          <div className="lp-fc"><span className="lp-fc-head">Company</span><a href="#">About</a><a href="#">Institutional</a><a href="#">Compliance</a></div>
          <div className="lp-fc"><span className="lp-fc-head">Contact</span><a href="mailto:info@deaistrategies.io">info@deaistrategies.io</a><span>+1 (416) 846-5142</span><span>1500 Royal Centre, Vancouver BC</span></div>
        </div>
      </footer>
    </div>
  );
}
