import React, { useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ScatterController,
  LineController
} from 'chart.js';
import { Line, Scatter } from 'react-chartjs-2';
import './LandingPage.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ScatterController,
  LineController
);

const RATIO_DATA = {
  '24H': { labels: ['1h', '2h', '4h', '6h', '8h', '10h', '12h', '14h', '16h', '18h', '20h', '22h', '24h', 'Now'], data: [0.002510, 0.002498, 0.002488, 0.002512, 0.002530, 0.002545, 0.002560, 0.002537, 0.002552, 0.002580, 0.002610, 0.002620, 0.002630, 0.002637] },
  '7D': { labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Now'], data: [0.002510, 0.002463, 0.002530, 0.002580, 0.002535, 0.002458, 0.002590, 0.002637] },
  '30D': { labels: ['W1', 'W2', 'W3', 'W4', 'Now'], data: [0.002200, 0.002350, 0.002420, 0.002560, 0.002637] },
  '1Y': { labels: ['Mar', 'May', 'Jul', 'Sep', 'Nov', 'Jan', 'Now'], data: [0.001800, 0.002100, 0.002300, 0.002450, 0.002500, 0.002580, 0.002637] },
  'ALL': { labels: ['2020', '2021', '2022', '2023', '2024', '2025', 'Now'], data: [0.000800, 0.005000, 0.008000, 0.013350, 0.006000, 0.003000, 0.002637] }
};

const subnets = [
  { x: 48, y: 30 }, { x: 50, y: 29 }, { x: 51, y: 30 }, { x: 52, y: 29 }, { x: 53, y: 35 }, { x: 54, y: 28 },
  { x: 49, y: 31 }, { x: 51, y: 26 }, { x: 52, y: 25 }, { x: 53, y: 28 }, { x: 54, y: 38 }, { x: 55, y: 34 },
  { x: 49, y: 28 }, { x: 50, y: 27 }, { x: 50, y: 30 }, { x: 52, y: 30 }, { x: 53, y: 31 }, { x: 51, y: 32 },
  { x: 50, y: 31 }, { x: 56, y: 34 }, { x: 58, y: 34 },
];

const frontierPts: { x: number, y: number }[] = [];
for (let v = 15; v <= 80; v++) {
  frontierPts.push({ x: v, y: 11 + Math.pow(v - 15, 0.68) * 1.55 });
}

export const LandingPage: React.FC<{ onSignIn: () => void }> = ({ onSignIn }) => {
  const [period, setPeriod] = useState<keyof typeof RATIO_DATA>('7D');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('vis');
        }
      });
    }, { threshold: 0.1 });

    const hiddenElements = document.querySelectorAll('.fi');
    hiddenElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const getGradient = (ctx: any, startColor: string, endColor: string, height: number) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, startColor);
    gradient.addColorStop(1, endColor);
    return gradient;
  };

  return (
    <div className="landing-page" ref={scrollRef}>
      {/* TICKER */}
      <div className="ticker-wrap">
        <div className="ticker-track">
          {[1, 2].map((i) => (
            <React.Fragment key={i}>
              <span className="tick"><span className="sym">TAO</span><span className="up">$482.14 ▲3.2%</span></span>
              <span className="tick"><span className="sym">SN1</span><span className="up">APY 12.4%</span></span>
              <span className="tick"><span className="sym">SN18</span><span className="up">Compute +8.1%</span></span>
              <span className="tick"><span className="sym">SN22</span><span className="up">Audio +19.7%</span></span>
              <span className="tick"><span className="sym">BTC</span><span className="dn">$96,210 ▼0.8%</span></span>
              <span className="tick"><span className="sym">ETH</span><span className="up">$3,840 ▲1.4%</span></span>
              <span className="tick"><span className="sym">SHARPE</span>2.18</span>
              <span className="tick"><span className="sym">TVL</span>$482.1M</span>
              <span className="tick"><span className="sym">NET APY</span><span className="up">24.82%</span></span>
              <span className="tick"><span className="sym">TAO/BTC</span><span className="up">0.002637 ▲5.03%</span></span>
              <span className="tick"><span className="sym">SN9</span><span className="up">Vision +14.2%</span></span>
              <span className="tick"><span className="sym">VOL</span>0.42</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* NAV */}
      <nav>
        <div className="logo">
          <div className="logo-mark">
            <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
              <polygon points="9,1.5 16.5,5.5 16.5,12.5 9,16.5 1.5,12.5 1.5,5.5" stroke="white" strokeWidth="1.5" fill="none" />
              <circle cx="9" cy="9" r="2.4" fill="white" />
            </svg>
          </div>
          <div className="logo-name">DeAI <span>Strategies</span></div>
        </div>
        <ul>
          <li><a href="#">Platform</a></li>
          <li><a href="#">Subnets</a></li>
          <li><a href="#">Research</a></li>
          <li><a href="#">Institutional</a></li>
        </ul>
        <div className="nav-btns">
          <button className="btn-ghost" onClick={onSignIn}>Sign In</button>
          <button className="btn-primary" onClick={onSignIn}>Request Access</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-grid">
          <div>
            <div className="eyebrow fi d1"><span className="dot"></span>Intelligence Capital Markets</div>
            <h1 className="fi d2">The Private Terminal<br />for the <em>Decentralized<br />AI Economy.</em></h1>
            <p className="hero-sub fi d3">Institutional-grade intelligence for allocating capital across Bittensor subnets. Real-time feeds, portfolio analytics, and AI-generated research — all in one regulated platform.</p>
            <div className="hero-cta fi d4">
              <button className="btn-primary btn-lg" onClick={onSignIn}>Request Institutional Access</button>
              <button className="btn-ghost btn-lg">View Demo</button>
            </div>
            <div className="hero-stats fi d4">
              <div><div className="hs-val">$482M</div><div className="hs-label">TVL Deployed</div></div>
              <div><div className="hs-val">24.8%</div><div className="hs-label">Avg APY</div></div>
              <div><div className="hs-val">32</div><div className="hs-label">Subnets</div></div>
              <div><div className="hs-val">2.18</div><div className="hs-label">Sharpe</div></div>
            </div>
          </div>
          <div className="hero-card fi d3">
            <div className="hc-top">
              <div className="hc-dots"><span className="d-r"></span><span className="d-y"></span><span className="d-g"></span></div>
              <div className="hc-tag">INTELLIGENCE FEED · LIVE</div>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 8px var(--green)', animation: 'pulse 2s infinite' }}></div>
            </div>
            <div className="hc-body">
              <div className="hc-stitle">Breaking Intelligence</div>
              <div className="news-feed">
                <div className="ni">
                  <div className="ni-time">2m</div>
                  <div><div className="ni-tag">MACRO</div><div className="ni-text">Fed signals pause — DeAI subnets outperforming benchmark by +4.2%.</div></div>
                </div>
                <div className="ni" style={{ borderColor: 'var(--cyan)' }}>
                  <div className="ni-time">9m</div>
                  <div><div className="ni-tag" style={{ background: 'rgba(34,211,238,0.1)', color: 'var(--cyan)' }}>SUBNET</div><div className="ni-text">SN22 Audio hits 6-month high emission rate. Validator Gini at 0.34.</div></div>
                </div>
                <div className="ni" style={{ borderColor: 'var(--amber)' }}>
                  <div className="ni-time">14m</div>
                  <div><div className="ni-tag" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--amber)' }}>REPORT</div><div className="ni-text">Q1 Subnet Risk Score Analysis generated — available for download.</div></div>
                </div>
              </div>
              <div className="hc-stitle">Portfolio Alpha</div>
              <div className="mc-wrap">
                <div className="mc-head"><span className="mc-name">Subnet Allocation</span><span className="mc-val">+24.8% YTD</span></div>
                <div style={{ height: 65 }}>
                  <Line
                    data={{
                      labels: Array(12).fill(''),
                      datasets: [{
                        data: [10, 14, 12, 18, 16, 22, 20, 26, 24, 30, 28, 35],
                        borderColor: '#7c7fff',
                        borderWidth: 2,
                        fill: true,
                        backgroundColor: (context) => {
                          const ctx = context.chart.ctx;
                          return getGradient(ctx, 'rgba(91,94,244,0.4)', 'rgba(91,94,244,0)', 65);
                        },
                        tension: 0.45,
                        pointRadius: 0
                      }]
                    }}
                    options={{
                      plugins: { legend: { display: false }, tooltip: { enabled: false } },
                      scales: { y: { display: false }, x: { display: false } },
                      animation: { duration: 1600 },
                      maintainAspectRatio: false
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* FEATURES */}
      <div className="sec">
        <div style={{ textAlign: 'center', marginBottom: 56 }} className="fi">
          <div className="sec-eye">Platform Capabilities</div>
          <div className="sec-title">Everything you need.<br />Nothing you don't.</div>
        </div>
        <div className="feat-grid fi">
          <div className="feat">
            <div className="feat-num">01</div>
            <div className="feat-icon">
              <svg width="19" height="19" fill="none" stroke="var(--vi)" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <div className="feat-title">Portfolio Optimization</div>
            <div className="feat-desc">Mean-variance efficient frontier construction across all active Bittensor subnets with automated rebalancing signals and risk-adjusted alpha scoring.</div>
          </div>
          <div className="feat">
            <div className="feat-num">02</div>
            <div className="feat-icon">
              <svg width="19" height="19" fill="none" stroke="var(--vi)" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div className="feat-title">Live Intelligence Feed</div>
            <div className="feat-desc">Up-to-the-minute news, macro signals, and subnet-specific events — AI-curated and ranked by portfolio impact so you never miss a move.</div>
          </div>
          <div className="feat">
            <div className="feat-num">03</div>
            <div className="feat-icon">
              <svg width="19" height="19" fill="none" stroke="var(--vi)" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <div className="feat-title">Institutional Reports</div>
            <div className="feat-desc">One-click generation of LP-ready research reports with deep dives on subnet valuation, risk scoring, emission dynamics, and allocation recommendations.</div>
          </div>
        </div>
      </div>

      <hr className="divider" />

      {/* REPORT GENERATOR */}
      <div className="sec">
        <div className="report-grid">
          <div className="fi">
            <div className="sec-eye">Institutional Report Generator</div>
            <div className="sec-title">Publish-ready research in <em style={{ fontStyle: 'italic', color: 'var(--vi)' }}>seconds.</em></div>
            <p className="sec-sub" style={{ marginBottom: 38 }}>Our AI engine synthesizes on-chain data, subnet metrics, valuation models, and macro context into comprehensive LP-grade research documents — on demand.</p>
            <div className="rf-list">
              <div className="rf-item"><div className="rf-badge">RVT</div><div><div className="rf-title">Valuation Models (RVT, P/E)</div><div className="rf-desc">Relative Value to Token and Price-to-Emissions ratios across all subnets in real time.</div></div></div>
              <div className="rf-item"><div className="rf-badge">β</div><div><div className="rf-title">Sharpe & Beta Calculations</div><div className="rf-desc">Risk-adjusted return metrics benchmarked against TAO index and broader DeFi baselines.</div></div></div>
              <div className="rf-item"><div className="rf-badge">QC</div><div><div className="rf-title">Code Quality Metrics</div><div className="rf-desc">Automated validator and miner code quality scoring — a proprietary signal no other platform offers.</div></div></div>
            </div>
          </div>
          <div className="rp-card fi d2">
            <div className="rp-hdr">
              <div className="rp-hdr-title">📄 Institutional Report</div>
              <div className="rp-status"><div className="rp-status-dot"></div>GENERATED 0:32s AGO</div>
            </div>
            <div className="rp-body">
              <div className="rp-title">Bittensor Subnet Intelligence<br />Q1 2026 — Risk Score Analysis</div>
              <div className="rp-date">FEB 22, 2026 · Confidential — Institutional</div>
              <div className="rp-metrics">
                <div className="rp-m"><div className="rp-m-label">Sharpe</div><div className="rp-m-val">2.18</div><div className="rp-m-chg up">▲ 0.14 MoM</div></div>
                <div className="rp-m"><div className="rp-m-label">Avg APY</div><div className="rp-m-val">24.8%</div><div className="rp-m-chg up">▲ 3.2%</div></div>
                <div className="rp-m"><div className="rp-m-label">Risk Vol</div><div className="rp-m-val">0.42</div><div className="rp-m-chg dn">▼ 0.06</div></div>
              </div>
              <div className="rp-excerpt"><strong>Executive Summary:</strong> Q1 2026 marks a structural inflection in Bittensor subnet maturity. SN22 Audio and SN1 Prediction demonstrate superior risk-adjusted returns, with RVT multiples compressing toward fair value. <strong>Code quality metrics</strong> improved 18% QoQ, suggesting validator competition is intensifying across the network…</div>
              <div className="rp-actions">
                <button className="rp-btn rp-btn-p">Export PDF</button>
                <button className="rp-btn rp-btn-g">Share</button>
                <button className="rp-btn rp-btn-g">Regenerate</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <hr className="divider" />

      {/* ANALYTICS: TAO/BTC + EFFICIENT FRONTIER */}
      <div className="sec fi">
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div className="sec-eye">Portfolio Analytics</div>
          <div className="sec-title">Deep market intelligence,<br />at a glance.</div>
        </div>

        {/* TAO/BTC */}
        <div className="chart-panel" style={{ marginBottom: 20 }}>
          <div className="cp-hdr">
            <div>
              <div className="cp-title">TAO / BTC Ratio</div>
              <div className="cp-sub">Is TAO gaining against Bitcoin? · Data from CoinGecko</div>
            </div>
            <div className="period-btns">
              {(['24H', '7D', '30D', '1Y', 'ALL'] as const).map(p => (
                <button key={p} className={`pb ${period === p ? 'pb-active' : ''}`} onClick={() => setPeriod(p)}>{p}</button>
              ))}
            </div>
          </div>
          <div className="cp-body" style={{ height: 260 }}>
            <Line
              data={{
                labels: RATIO_DATA[period].labels,
                datasets: [{
                  data: RATIO_DATA[period].data,
                  borderColor: '#c084fc',
                  borderWidth: 2.5,
                  fill: true,
                  backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    return getGradient(ctx, 'rgba(192,132,252,0.35)', 'rgba(192,132,252,0.0)', 180);
                  },
                  tension: 0.45,
                  pointRadius: 0,
                  pointHoverRadius: 5,
                  pointHoverBackgroundColor: '#c084fc',
                  pointHoverBorderColor: '#fff',
                  pointHoverBorderWidth: 2
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: '#0b0d1a',
                    borderColor: 'rgba(192,132,252,0.4)',
                    borderWidth: 1,
                    titleColor: '#8492be',
                    bodyColor: '#dde4f8',
                    padding: 12,
                    callbacks: { label: (c) => ' TAO/BTC: ' + Number(c.raw).toFixed(6) }
                  }
                },
                scales: {
                  y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8492be', font: { family: "'JetBrains Mono',monospace", size: 10 }, callback: (v) => Number(v).toFixed(5) }, border: { display: false } },
                  x: { grid: { display: false }, ticks: { color: '#8492be', font: { family: "'JetBrains Mono',monospace", size: 10 } }, border: { color: 'rgba(255,255,255,0.06)' } }
                }
              }}
            />
          </div>
          <div className="ratio-stats">
            <div className="rs"><div className="rs-label">Current Ratio</div><div className="rs-val v-purple">0.002637 BTC</div></div>
            <div className="rs"><div className="rs-label">Period Change</div><div className="rs-val v-green">+5.03%</div></div>
            <div className="rs"><div className="rs-label">Signal</div><div className="rs-val v-cyan">Outperforming</div></div>
            <div className="rs"><div className="rs-label">ATH Ratio</div><div className="rs-val v-white">0.01335 BTC</div></div>
          </div>
        </div>

        {/* EFFICIENT FRONTIER */}
        <div className="chart-panel">
          <div className="cp-hdr">
            <div>
              <div className="cp-title">Efficient Frontier</div>
              <div className="cp-sub">Risk-return tradeoff. Points on the curve represent optimal portfolios for each risk level.</div>
            </div>
          </div>
          <div className="cp-body" style={{ height: 320 }}>
            <Scatter
              data={{
                datasets: [
                  { label: 'Individual Subnets', data: subnets, backgroundColor: 'rgba(245,158,11,0.88)', borderColor: 'rgba(245,158,11,0.2)', borderWidth: 1, pointRadius: 8, pointHoverRadius: 10 },
                  { label: 'Your Portfolio', data: [{ x: 21, y: 33 }], backgroundColor: 'rgba(16,185,129,0.95)', borderColor: 'rgba(16,185,129,0.4)', borderWidth: 2, pointRadius: 14, pointHoverRadius: 16 },
                  { label: 'Efficient Frontier', data: frontierPts as any, type: 'line', borderColor: 'rgba(34,211,238,0.85)', borderWidth: 2.5, fill: false, tension: 0.4, pointRadius: 0 }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: '#0b0d1a',
                    borderColor: 'rgba(91,94,244,0.4)',
                    borderWidth: 1,
                    titleColor: '#8492be',
                    bodyColor: '#dde4f8',
                    padding: 12,
                    callbacks: {
                      label: (ctx) => {
                        const raw = ctx.raw as any;
                        if (ctx.dataset.label === 'Individual Subnets') return ` Vol: ${raw.x}%  Return: ${raw.y}%`;
                        if (ctx.dataset.label === 'Your Portfolio') return ` Portfolio  Vol: ${raw.x}%  Return: ${raw.y}%`;
                        return '';
                      }
                    }
                  }
                },
                scales: {
                  x: { title: { display: true, text: 'Volatility (%)', color: '#8492be', font: { family: "'DM Sans',sans-serif", size: 12 } }, min: 10, max: 80, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8492be', font: { family: "'JetBrains Mono',monospace", size: 10 } }, border: { color: 'rgba(255,255,255,0.05)' } },
                  y: { title: { display: true, text: 'Expected Return (%)', color: '#8492be', font: { family: "'DM Sans',sans-serif", size: 12 } }, min: 10, max: 45, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8492be', font: { family: "'JetBrains Mono',monospace", size: 10 } }, border: { color: 'rgba(255,255,255,0.05)' } }
                }
              }}
            />
          </div>
          <div className="frontier-legend">
            <div className="leg"><div className="leg-line"></div> Efficient Frontier</div>
            <div className="leg"><div className="leg-dot" style={{ background: '#10b981' }}></div> Your Portfolio</div>
            <div className="leg"><div className="leg-dot" style={{ background: '#f59e0b' }}></div> Individual Subnets</div>
          </div>
        </div>
      </div>

      <hr className="divider" />

      {/* LIVE NEWS */}
      <div className="sec fi">
        <div style={{ marginBottom: 44 }}>
          <div className="sec-eye">Intelligence Feed</div>
          <div className="sec-title">Up to the minute.<br />Always on.</div>
          <p className="sec-sub">Real-time news, macro signals, and subnet events curated by AI and ranked by portfolio impact.</p>
        </div>
        <div className="news-layout">
          <div className="news-stream">
            <div className="ns-hdr">
              <div className="ns-hdr-title">Live Intelligence Feed</div>
              <div className="live-badge"><span className="live-dot"></span>Live</div>
            </div>
            <div className="ns-scroll">
              <div className="ns-item">
                <div className="ns-top"><span className="ns-cat c-macro">Macro</span><span className="ns-time">2 min ago</span></div>
                <div className="ns-headline">Federal Reserve signals extended pause; risk assets rally as DeFi TVL climbs 4.2% intraday.</div>
                <div className="impact"><span>Impact</span><div className="impact-bar"><div className="impact-fill" style={{ width: '85%', background: 'var(--green)' }}></div></div><span style={{ fontFamily: "'JetBrains Mono',monospace", color: 'var(--green)', fontSize: 9 }}>HIGH</span></div>
              </div>
              <div className="ns-item">
                <div className="ns-top"><span className="ns-cat c-subnet">Subnet</span><span className="ns-time">9 min ago</span></div>
                <div className="ns-headline">SN22 Audio subnet reaches 6-month peak emission rate. Validator concentration drops to 0.34 Gini.</div>
                <div className="impact"><span>Impact</span><div className="impact-bar"><div className="impact-fill" style={{ width: '72%', background: 'var(--cyan)' }}></div></div><span style={{ fontFamily: "'JetBrains Mono',monospace", color: 'var(--cyan)', fontSize: 9 }}>MED-HIGH</span></div>
              </div>
              <div className="ns-item">
                <div className="ns-top"><span className="ns-cat c-ai">AI</span><span className="ns-time">22 min ago</span></div>
                <div className="ns-headline">Anthropic releases Claude 4 — immediate uplift observed in SN1 Prediction miner benchmark scores.</div>
                <div className="impact"><span>Impact</span><div className="impact-bar"><div className="impact-fill" style={{ width: '60%', background: 'var(--green)' }}></div></div><span style={{ fontFamily: "'JetBrains Mono',monospace", color: 'var(--green)', fontSize: 9 }}>MEDIUM</span></div>
              </div>
              <div className="ns-item">
                <div className="ns-top"><span className="ns-cat c-defi">DeFi</span><span className="ns-time">38 min ago</span></div>
                <div className="ns-headline">TAO perpetuals open interest hits $340M. Options market pricing 42-day implied vol at 68%.</div>
                <div className="impact"><span>Impact</span><div className="impact-bar"><div className="impact-fill" style={{ width: '50%', background: 'var(--amber)' }}></div></div><span style={{ fontFamily: "'JetBrains Mono',monospace", color: 'var(--amber)', fontSize: 9 }}>MEDIUM</span></div>
              </div>
              <div className="ns-item">
                <div className="ns-top"><span className="ns-cat c-macro">Macro</span><span className="ns-time">1h ago</span></div>
                <div className="ns-headline">Canadian MSB regulatory update: DeAI Strategies confirmed compliant for Q2 2026 operations.</div>
                <div className="impact"><span>Impact</span><div className="impact-bar"><div className="impact-fill" style={{ width: '28%', background: 'var(--indigo)' }}></div></div><span style={{ fontFamily: "'JetBrains Mono',monospace", color: 'var(--vi)', fontSize: 9 }}>LOW</span></div>
              </div>
            </div>
          </div>
          <div className="sig-panel">
            <div className="sig-card">
              <div className="sig-card-title">Active Signals</div>
              <div className="sig-list">
                <div className="sig-row">
                  <div><div className="sig-name">SN1 Prediction</div><div className="sig-meta">12.4% APY · Low Vol</div></div>
                  <div style={{ textAlign: 'right' }}><div className="sig-val" style={{ color: 'var(--green)' }}>+12.4%</div><div className="sig-badge sb-buy">BUY</div></div>
                </div>
                <div className="sig-row">
                  <div><div className="sig-name">SN22 Audio</div><div className="sig-meta">19.7% APY · Med Vol</div></div>
                  <div style={{ textAlign: 'right' }}><div className="sig-val" style={{ color: 'var(--green)' }}>+19.7%</div><div className="sig-badge sb-buy">BUY</div></div>
                </div>
                <div className="sig-row">
                  <div><div className="sig-name">SN18 Compute</div><div className="sig-meta">8.1% APY · Low Vol</div></div>
                  <div style={{ textAlign: 'right' }}><div className="sig-val" style={{ color: 'var(--vi)' }}>+8.1%</div><div className="sig-badge sb-hold">HOLD</div></div>
                </div>
                <div className="sig-row">
                  <div><div className="sig-name">SN9 Vision</div><div className="sig-meta">14.2% APY · Med Vol</div></div>
                  <div style={{ textAlign: 'right' }}><div className="sig-val" style={{ color: 'var(--amber)' }}>+14.2%</div><div className="sig-badge sb-watch">WATCH</div></div>
                </div>
              </div>
            </div>
            <div className="sig-card">
              <div className="sig-card-title">Market Pulse</div>
              <div className="sig-list">
                <div className="sig-row"><div className="sig-name">TAO / USD</div><div className="sig-val" style={{ color: 'var(--green)' }}>$482.14 ▲3.2%</div></div>
                <div className="sig-row"><div className="sig-name">Network Hashrate</div><div className="sig-val" style={{ color: 'var(--text)' }}>1.42 PH/s</div></div>
                <div className="sig-row"><div className="sig-name">Active Validators</div><div className="sig-val" style={{ color: 'var(--text)' }}>2,048</div></div>
                <div className="sig-row"><div className="sig-name">24h Volume</div><div className="sig-val" style={{ color: 'var(--green)' }}>$84.3M</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <hr className="divider" />

      {/* COMPARISON */}
      <div className="sec fi">
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div className="sec-eye">Competitive Intelligence</div>
          <div className="sec-title">No other platform<br />comes close.</div>
        </div>
        <div className="comp-card">
          <div className="comp-hdr">
            <div>
              <div className="comp-hdr-title">Capability Comparison</div>
              <div className="comp-hdr-sub">Bittensor Intelligence vs. existing market alternatives</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Capability</th>
                <th className="feat-col"><div className="th-inner"><svg width="13" height="13" viewBox="0 0 18 18" fill="none"><polygon points="9,1.5 16.5,5.5 16.5,12.5 9,16.5 1.5,12.5 1.5,5.5" stroke="currentColor" strokeWidth="1.5" /><circle cx="9" cy="9" r="2.4" fill="currentColor" /></svg>Bittensor Intelligence</div></th>
                <th className="other">TaoStats</th>
                <th className="other">Nansen</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Portfolio Optimization</td><td className="feat-col"><span className="chk">✓</span></td><td className="other"><span className="dsh">—</span></td><td className="other"><span className="dsh">—</span></td></tr>
              <tr><td>Efficient Frontier Analysis</td><td className="feat-col"><span className="chk">✓</span></td><td className="other"><span className="dsh">—</span></td><td className="other"><span className="dsh">—</span></td></tr>
              <tr><td>Multi-Dimensional Risk Scoring</td><td className="feat-col"><span className="chk">✓</span></td><td className="other"><span className="dsh">—</span></td><td className="other"><span className="dsh">—</span></td></tr>
              <tr><td>Institutional Report Generator</td><td className="feat-col"><span className="chk">✓</span></td><td className="other"><span className="dsh">—</span></td><td className="other"><span className="dsh">—</span></td></tr>
              <tr><td>Real-Time Price Data</td><td className="feat-col"><span className="chk">✓</span></td><td className="other"><span className="chk">✓</span></td><td className="other"><span className="dsh">—</span></td></tr>
              <tr><td>Sharpe & Beta Calculations</td><td className="feat-col"><span className="chk">✓</span></td><td className="other"><span className="dsh">—</span></td><td className="other"><span className="chk">✓</span></td></tr>
              <tr><td>Valuation Models (RVT, P/E)</td><td className="feat-col"><span className="chk">✓</span></td><td className="other"><span className="dsh">—</span></td><td className="other"><span className="dsh">—</span></td></tr>
              <tr><td>Code Quality Metrics</td><td className="feat-col"><span className="chk">✓</span></td><td className="other"><span className="dsh">—</span></td><td className="other"><span className="chk">✓</span></td></tr>
              <tr><td>Bittensor-Native Focus</td><td className="feat-col"><span className="chk">✓</span></td><td className="other"><span className="chk">✓</span></td><td className="other"><span className="dsh">—</span></td></tr>
              <tr><td>Regulated Canadian MSB Framework</td><td className="feat-col"><span className="chk">✓</span></td><td className="other"><span className="dsh">—</span></td><td className="other"><span className="dsh">—</span></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <hr className="divider" />

      {/* CTA */}
      <div className="sec fi">
        <div className="cta-wrap">
          <div className="sec-eye" style={{ marginBottom: 18 }}>Get Started Today</div>
          <div className="cta-title">The edge is<br /><em>already live.</em></div>
          <p className="cta-sub">Join institutions allocating intelligently in the decentralized AI economy. Request full platform access.</p>
          <div className="cta-btns">
            <button className="btn-primary btn-lg" onClick={onSignIn}>Request Institutional Access</button>
            <button className="btn-ghost btn-lg">Schedule a Demo</button>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer>
        <div>
          <div className="logo">
            <div className="logo-mark" style={{ width: 28, height: 28 }}>
              <svg width="13" height="13" viewBox="0 0 18 18" fill="none"><polygon points="9,1.5 16.5,5.5 16.5,12.5 9,16.5 1.5,12.5 1.5,5.5" stroke="white" strokeWidth="1.5" fill="none" /><circle cx="9" cy="9" r="2.4" fill="white" /></svg>
            </div>
            <div className="logo-name" style={{ fontSize: 15 }}>DeAI <span>Strategies</span></div>
          </div>
          <div className="foot-copy">© 2026 DeAI Strategies Corp. All Rights Reserved.<br />Regulated under Canadian MSB Framework. SOC-2 Compliant.</div>
        </div>
        <div className="foot-cols">
          <div className="fc"><span className="fc-head">Platform</span><a href="#">Terminal</a><a href="#">Subnets</a><a href="#">Risk Engine</a><a href="#">Reports</a></div>
          <div className="fc"><span className="fc-head">Company</span><a href="#">About</a><a href="#">Institutional</a><a href="#">Compliance</a></div>
          <div className="fc"><span className="fc-head">Contact</span><a href="mailto:info@deaistrategies.io">info@deaistrategies.io</a><span>+1 (416) 846-5142</span><span>1500 Royal Centre, Vancouver BC</span></div>
        </div>
      </footer>
    </div>
  );
};
