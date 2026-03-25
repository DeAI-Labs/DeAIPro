'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import './landing.css';
import { fetchStats, fetchNews, type Stats, type NewsItem } from '@/lib/api';

function fmt(n: number, prefix = '$'): string {
  if (n >= 1e9) return `${prefix}${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${prefix}${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${prefix}${(n / 1e3).toFixed(1)}K`;
  return `${prefix}${n.toFixed(2)}`;
}

const RATIO_DATA: Record<string, any> = {
  '24H':{labels:['1h','2h','4h','6h','8h','10h','12h','14h','16h','18h','20h','22h','24h','Now'],data:[0.002510,0.002498,0.002488,0.002512,0.002530,0.002545,0.002560,0.002537,0.002552,0.002580,0.002610,0.002620,0.002630,0.002637]},
  '7D':{labels:['Sun','Mon','Tue','Wed','Thu','Fri','Sat','Now'],data:[0.002510,0.002463,0.002530,0.002580,0.002535,0.002458,0.002590,0.002637]},
  '30D':{labels:['W1','W2','W3','W4','Now'],data:[0.002200,0.002350,0.002420,0.002560,0.002637]},
  '1Y':{labels:['Mar','May','Jul','Sep','Nov','Jan','Now'],data:[0.001800,0.002100,0.002300,0.002450,0.002500,0.002580,0.002637]},
  'ALL':{labels:['2020','2021','2022','2023','2024','2025','Now'],data:[0.000800,0.005000,0.008000,0.013350,0.006000,0.003000,0.002637]}
};

export default function LandingPage() {
  const router = useRouter();
  const [reportSeconds, setReportSeconds] = useState(12);
  const [stats, setStats] = useState<Stats | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const taoBtcChartRef = useRef<any>(null);
  const frontierChartRef = useRef<any>(null);

  useEffect(() => {
    const timer = setInterval(() => setReportSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

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
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('vis'); });
    }, {threshold:0.08});
    document.querySelectorAll('.fi').forEach((el) => { obs.observe(el); });

    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    script.onload = () => {
      const Chart = (window as any).Chart;
      if (!Chart) return;

      const mcEl = document.getElementById('miniChart') as HTMLCanvasElement;
      if (mcEl) {
        const mc = mcEl.getContext('2d');
        if (mc) {
          const mg = mc.createLinearGradient(0,0,0,65);
          mg.addColorStop(0,'rgba(91,94,244,0.4)'); mg.addColorStop(1,'rgba(91,94,244,0)');
          new Chart(mc, { type:'line', data:{ labels:Array(12).fill(''), datasets:[{data:[10,14,12,18,16,22,20,26,24,30,28,35], borderColor:'#7c7fff', borderWidth:2, fill:true, backgroundColor:mg, tension:0.45, pointRadius:0}] }, options:{plugins:{legend:{display:false},tooltip:{enabled:false}}, scales:{y:{display:false},x:{display:false}}, animation:{duration:1600}}});
        }
      }

      const tcEl = document.getElementById('taoBtcChart') as HTMLCanvasElement;
      if (tcEl) {
        const tc = tcEl.getContext('2d');
        if (tc) {
          const tg = tc.createLinearGradient(0,0,0,180);
          tg.addColorStop(0,'rgba(192,132,252,0.35)'); tg.addColorStop(1,'rgba(192,132,252,0)');
          taoBtcChartRef.current = new Chart(tc, {
            type:'line',
            data:{labels:RATIO_DATA['7D'].labels, datasets:[{data:RATIO_DATA['7D'].data, borderColor:'#c084fc', borderWidth:2.5, fill:true, backgroundColor:tg, tension:0.45, pointRadius:0, pointHoverRadius:5, pointHoverBackgroundColor:'#c084fc', pointHoverBorderColor:'#fff', pointHoverBorderWidth:2}]},
            options:{ responsive:true, plugins:{legend:{display:false}, tooltip:{backgroundColor:'#0b0d1a', borderColor:'rgba(192,132,252,0.4)', borderWidth:1, titleColor:'#8492be', bodyColor:'#dde4f8', padding:12, callbacks:{label:function(ctx:any){return ' TAO/BTC: '+ctx.raw.toFixed(6);}}}}, scales:{ y:{grid:{color:'rgba(255,255,255,0.04)'}, ticks:{color:'#8492be', font:{family:"'JetBrains Mono',monospace", size:10}, callback:function(v:any){return v.toFixed(5);}}, border:{display:false}}, x:{grid:{display:false}, ticks:{color:'#8492be', font:{family:"'JetBrains Mono',monospace", size:10}}, border:{color:'rgba(255,255,255,0.06)'}} } }
          });
        }
      }

      const fcEl = document.getElementById('frontierChart') as HTMLCanvasElement;
      if (fcEl) {
        const fc = fcEl.getContext('2d');
        if (fc) {
          const subnets = [{x:48,y:30},{x:50,y:29},{x:51,y:30},{x:52,y:29},{x:53,y:35},{x:54,y:28},{x:49,y:31},{x:51,y:26},{x:52,y:25},{x:53,y:28},{x:54,y:38},{x:55,y:34},{x:49,y:28},{x:50,y:27},{x:50,y:30},{x:52,y:30},{x:53,y:31},{x:51,y:32},{x:50,y:31},{x:56,y:34},{x:58,y:34}];
          const frontierPts = [];
          for (let v = 15; v <= 80; v++) { frontierPts.push({x:v, y:11+Math.pow(v-15,0.68)*1.55}); }
          frontierChartRef.current = new Chart(fc, {
            type:'scatter',
            data:{datasets:[ {label:'Individual Subnets', data:subnets, backgroundColor:'rgba(245,158,11,0.88)', borderColor:'rgba(245,158,11,0.2)', borderWidth:1, pointRadius:8, pointHoverRadius:10}, {label:'Your Portfolio', data:[{x:21,y:33}], backgroundColor:'rgba(16,185,129,0.95)', borderColor:'rgba(16,185,129,0.4)', borderWidth:2, pointRadius:14, pointHoverRadius:16}, {label:'Efficient Frontier', data:frontierPts, type:'line', borderColor:'rgba(34,211,238,0.85)', borderWidth:2.5, fill:false, tension:0.4, pointRadius:0, showLine:true as any} ]},
            options:{ responsive:true, plugins:{legend:{display:false}, tooltip:{backgroundColor:'#0b0d1a', borderColor:'rgba(91,94,244,0.4)', borderWidth:1, titleColor:'#8492be', bodyColor:'#dde4f8', padding:12, callbacks:{label:function(ctx:any){if(ctx.dataset.label==='Individual Subnets') return ' Vol: '+ctx.raw.x+'%  Return: '+ctx.raw.y+'%'; if(ctx.dataset.label==='Your Portfolio') return ' Portfolio  Vol: '+ctx.raw.x+'%  Return: '+ctx.raw.y+'%'; return null;}}}}, scales:{ x:{title:{display:true, text:'Volatility (%)', color:'#8492be', font:{family:"'DM Sans',sans-serif", size:12}}, min:10, max:80, grid:{color:'rgba(255,255,255,0.04)'}, ticks:{color:'#8492be', font:{family:"'JetBrains Mono',monospace", size:10}}, border:{color:'rgba(255,255,255,0.05)'}}, y:{title:{display:true, text:'Expected Return (%)', color:'#8492be', font:{family:"'DM Sans',sans-serif", size:12}}, min:10, max:45, grid:{color:'rgba(255,255,255,0.04)'}, ticks:{color:'#8492be', font:{family:"'JetBrains Mono',monospace", size:10}}, border:{color:'rgba(255,255,255,0.05)'}} } }
          });
        }
      }
    };
    document.body.appendChild(script);
    return () => {
      obs.disconnect(); document.head.contains(link) && document.head.removeChild(link); document.body.contains(script) && document.body.removeChild(script);
      taoBtcChartRef.current?.destroy(); frontierChartRef.current?.destroy();
    };
  }, []);

  const switchPeriod = (e: React.MouseEvent<HTMLButtonElement>, p: string) => {
    document.querySelectorAll('.pb').forEach(b => b.classList.remove('pb-active'));
    (e.target as HTMLButtonElement).classList.add('pb-active');
    if (taoBtcChartRef.current) {
      taoBtcChartRef.current.data.labels = RATIO_DATA[p].labels; taoBtcChartRef.current.data.datasets[0].data = RATIO_DATA[p].data; taoBtcChartRef.current.update();
    }
  };

  const taoPrice = stats?.tao_price || 482.14;
  const taoPriceChg = stats?.tao_price_change_24h || 3.2;
  const volume24h = stats?.volume_24h || 84300000;
  const activeSubnets = stats?.active_subnets || 32;
  const marketCap = stats?.market_cap || 1200000000;
  const taoBtc = stats?.tao_price_btc || 0.002637;

  const tickerItems = [
    { sym: 'TAO', val: `$${taoPrice.toFixed(2)} ${taoPriceChg >= 0 ? '▲' : '▼'}${Math.abs(taoPriceChg).toFixed(1)}%`, cls: taoPriceChg >= 0 ? 'up' : 'dn' },
    { sym: 'SN1', val: 'APY 12.4%', cls: 'up' }, { sym: 'SN18', val: 'Compute +8.1%', cls: 'up' }, { sym: 'SN22', val: 'Audio +19.7%', cls: 'up' },
    { sym: 'MCAP', val: fmt(marketCap), cls: 'up' }, { sym: 'VOL', val: fmt(volume24h), cls: 'up' }, { sym: 'SHARPE', val: '2.18', cls: '' },
    { sym: 'TVL', val: '$482.1M', cls: '' }, { sym: 'NET APY', val: '24.82%', cls: 'up' }, { sym: 'TAO/BTC', val: taoBtc.toFixed(6), cls: 'up' },
    { sym: 'SUBNETS', val: `${activeSubnets}`, cls: 'up' }, { sym: 'VOL', val: '0.42', cls: '' }
  ];

  return (
    <>
      <div className="ticker-wrap">
        <div className="ticker-track">
          {[...tickerItems, ...tickerItems].map((t, i) => (
            <span className="tick" key={i}><span className="sym">{t.sym}</span><span className={t.cls}>{t.val}</span></span>
          ))}
        </div>
      </div>
      <nav>
        <div className="logo">
          <div className="logo-mark">&#x3C4;</div>
          <div className="logo-name">DeAI <span>Strategies</span></div>
        </div>
        <ul><li><Link href="/dashboard">Platform</Link></li><li><Link href="/dashboard">Subnets</Link></li><li><Link href="/dashboard">Research</Link></li><li><Link href="/dashboard">Institutional</Link></li></ul>
        <div className="nav-btns"><button className="btn-ghost" onClick={() => router.push('/login')}>Sign In</button><button className="btn-primary" onClick={() => router.push('/dashboard')}>Request Access</button></div>
      </nav>
      <section className="hero">
        <div className="hero-grid">
          <div>
            <div className="eyebrow fi d1"><span className="dot"></span>Intelligence Capital Markets</div>
            <h1 className="fi d2">Institutional Access<br/>to the <em>Decentralized<br/>AI Economy.</em></h1>
            <p className="hero-sub fi d3">Regulated, vertically integrated intelligence for allocating capital across Bittensor subnets. Real-time feeds, portfolio analytics, and AI-generated research in one platform.</p>
            <div className="hero-cta fi d4"><button className="btn-primary btn-lg" onClick={() => router.push('/dashboard')}>Request Institutional Access</button><button className="btn-ghost btn-lg" onClick={() => router.push('/dashboard')}>View Demo</button></div>
            <div className="hero-stats fi d4">
              <div><div className="hs-val">{marketCap ? fmt(marketCap) : '...'}</div><div className="hs-label">Market Cap</div></div>
              <div><div className="hs-val">{volume24h ? fmt(volume24h) : '...'}</div><div className="hs-label">24h Volume</div></div>
              <div><div className="hs-val">{activeSubnets || '...'}</div><div className="hs-label">Subnets</div></div>
              <div><div className="hs-val">{taoPrice ? `$${taoPrice.toFixed(0)}` : '...'}</div><div className="hs-label">TAO Price</div></div>
            </div>
          </div>
          <div className="hero-card fi d3">
            <div className="hc-top"><div className="hc-dots"><span className="d-r"></span><span className="d-y"></span><span className="d-g"></span></div><div className="hc-tag">INTELLIGENCE FEED &middot; LIVE</div><div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 8px var(--green)', animation: 'blink 2s infinite' }}></div></div>
            <div className="hc-body">
              <div className="hc-stitle">Breaking Intelligence</div>
              <div className="news-feed">
                {news.length > 0 ? news.slice(0, 3).map((item, i) => (
                  <div className="ni" key={i} style={i === 1 ? { borderColor: 'var(--cyan)' } : i === 2 ? { borderColor: 'var(--amber)' } : {}}>
                    <div className="ni-time">{item.timestamp || 'Now'}</div>
                    <div><div className="ni-tag" style={i === 1 ? { background: 'rgba(34,211,238,0.1)', color: 'var(--cyan)' } : i === 2 ? { background: 'rgba(245,158,11,0.1)', color: 'var(--amber)' } : {}}>{item.category?.toUpperCase() || 'NEWS'}</div><div className="ni-text">{item.title}</div></div>
                  </div>
                )) : (
                  <>
                    <div className="ni"><div className="ni-time">Just now</div><div><div className="ni-tag">MACRO</div><div className="ni-text">Fed signals pause &mdash; DeAI subnets outperforming benchmark by +4.2%.</div></div></div>
                    <div className="ni" style={{ borderColor: 'var(--cyan)' }}><div className="ni-time">5m ago</div><div><div className="ni-tag" style={{ background: 'rgba(34,211,238,0.1)', color: 'var(--cyan)' }}>SUBNET</div><div className="ni-text">SN22 Audio hits 6-month high emission rate. Validator Gini at 0.34.</div></div></div>
                    <div className="ni" style={{ borderColor: 'var(--amber)' }}><div className="ni-time">12m ago</div><div><div className="ni-tag" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--amber)' }}>REPORT</div><div className="ni-text">Q1 Subnet Risk Score Analysis generated &mdash; available for download.</div></div></div>
                  </>
                )}
              </div>
              <div className="hc-stitle">Portfolio Alpha</div>
              <div className="mc-wrap"><div className="mc-head"><span className="mc-name">Subnet Allocation</span><span className="mc-val">+24.8% YTD</span></div><canvas id="miniChart" height="65"></canvas></div>
            </div>
          </div>
        </div>
      </section>
      <hr className="divider" />
      <div className="sec">
        <div style={{ textAlign: 'center', marginBottom: 56 }} className="fi"><div className="sec-eye">Platform Capabilities</div><div className="sec-title">Everything you need.<br/>Nothing you don&apos;t.</div></div>
        <div className="feat-grid fi">
          <div className="feat">
            <div className="feat-num">01</div><div className="feat-icon"><svg width="19" height="19" fill="none" stroke="var(--vi)" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg></div>
            <div className="feat-title">Portfolio Optimization</div><div className="feat-desc">Mean-variance efficient frontier construction across all active Bittensor subnets with automated rebalancing signals and risk-adjusted alpha scoring.</div>
          </div>
          <div className="feat">
            <div className="feat-num">02</div><div className="feat-icon"><svg width="19" height="19" fill="none" stroke="var(--vi)" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg></div>
            <div className="feat-title">Live Intelligence Feed</div><div className="feat-desc">Up-to-the-minute news, macro signals, and subnet-specific events &mdash; AI-curated and ranked by portfolio impact so you never miss a move.</div>
          </div>
          <div className="feat">
            <div className="feat-num">03</div><div className="feat-icon"><svg width="19" height="19" fill="none" stroke="var(--vi)" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg></div>
            <div className="feat-title">Institutional Reports</div><div className="feat-desc">One-click generation of LP-ready research reports with deep dives on subnet valuation, risk scoring, emission dynamics, and allocation recommendations.</div>
          </div>
        </div>
      </div>
      <hr className="divider" />
      <div className="sec">
        <div className="report-grid">
          <div className="fi">
            <div className="sec-eye">Institutional Report Generator</div><div className="sec-title">Publish-ready research in <em style={{ fontStyle: 'italic', color: 'var(--vi)' }}>seconds.</em></div>
            <p className="sec-sub" style={{ marginBottom: 38 }}>Our AI engine synthesizes on-chain data, subnet metrics, valuation models, and macro context into comprehensive LP-grade research documents &mdash; on demand.</p>
            <div className="rf-list">
              <div className="rf-item"><div className="rf-badge">RVT</div><div><div className="rf-title">Valuation Models (RVT, P/E)</div><div className="rf-desc">Relative Value to Token and Price-to-Emissions ratios across all subnets in real time.</div></div></div>
              <div className="rf-item"><div className="rf-badge">&#946;</div><div><div className="rf-title">Sharpe &amp; Beta Calculations</div><div className="rf-desc">Risk-adjusted return metrics benchmarked against TAO index and broader DeFi baselines.</div></div></div>
              <div className="rf-item"><div className="rf-badge">QC</div><div><div className="rf-title">Code Quality Metrics</div><div className="rf-desc">Automated validator and miner code quality scoring &mdash; a proprietary signal no other platform offers.</div></div></div>
            </div>
          </div>
          <div className="rp-card fi d2">
            <div className="rp-hdr"><div className="rp-hdr-title">&#128196; Institutional Report</div><div className="rp-status"><div className="rp-status-dot"></div>GENERATED {reportSeconds}s AGO</div></div>
            <div className="rp-body">
              <div className="rp-title">Bittensor Subnet Intelligence<br/>Q1 2026 &mdash; Risk Score Analysis</div><div className="rp-date">FEB 22, 2026 &middot; Confidential &mdash; Institutional</div>
              <div className="rp-metrics">
                <div className="rp-m"><div className="rp-m-label">Sharpe</div><div className="rp-m-val">2.18</div><div className="rp-m-chg up">&#9650; 0.14 MoM</div></div>
                <div className="rp-m"><div className="rp-m-label">Avg APY</div><div className="rp-m-val">24.8%</div><div className="rp-m-chg up">&#9650; 3.2%</div></div>
                <div className="rp-m"><div className="rp-m-label">Risk Vol</div><div className="rp-m-val">0.42</div><div className="rp-m-chg dn">&#9660; 0.06</div></div>
              </div>
              <div className="rp-excerpt"><strong>Executive Summary:</strong> Q1 2026 marks a structural inflection in Bittensor subnet maturity. SN22 Audio and SN1 Prediction demonstrate superior risk-adjusted returns, with RVT multiples compressing toward fair value. <strong>Code quality metrics</strong> improved 18% QoQ, suggesting validator competition is intensifying&hellip;</div>
              <div className="rp-actions"><button className="rp-btn rp-btn-p">Export PDF</button><button className="rp-btn rp-btn-g">Share</button><button className="rp-btn rp-btn-g">Regenerate</button></div>
            </div>
          </div>
        </div>
      </div>
      <hr className="divider" />
      <div className="sec fi">
        <div style={{ textAlign: 'center', marginBottom: 44 }}><div className="sec-eye">Portfolio Analytics</div><div className="sec-title">Deep market intelligence,<br/>at a glance.</div></div>
        <div className="chart-panel" style={{ marginBottom: 20 }}>
          <div className="cp-hdr">
            <div><div className="cp-title">TAO / BTC Ratio</div><div className="cp-sub">Is TAO gaining against Bitcoin? &middot; Data from CoinGecko</div></div>
            <div className="period-btns"><button className="pb" onClick={(e) => switchPeriod(e, '24H')}>24H</button><button className="pb pb-active" onClick={(e) => switchPeriod(e, '7D')}>7D</button><button className="pb" onClick={(e) => switchPeriod(e, '30D')}>30D</button><button className="pb" onClick={(e) => switchPeriod(e, '1Y')}>1Y</button><button className="pb" onClick={(e) => switchPeriod(e, 'ALL')}>ALL</button></div>
          </div>
          <div className="cp-body"><canvas id="taoBtcChart" height="180"></canvas></div>
          <div className="ratio-stats">
            <div className="rs"><div className="rs-label">Current Ratio</div><div className="rs-val v-purple">{taoBtc.toFixed(6)} BTC</div></div><div className="rs"><div className="rs-label">Period Change</div><div className="rs-val v-green">+5.03%</div></div><div className="rs"><div className="rs-label">Signal</div><div className="rs-val v-cyan">Outperforming</div></div><div className="rs"><div className="rs-label">ATH Ratio</div><div className="rs-val v-white">0.01335 BTC</div></div>
          </div>
        </div>
        <div className="chart-panel">
          <div className="cp-hdr"><div><div className="cp-title">Efficient Frontier</div><div className="cp-sub">Risk-return tradeoff. Points on the curve represent optimal portfolios for each risk level.</div></div></div>
          <div className="cp-body"><canvas id="frontierChart" height="260"></canvas></div>
          <div className="frontier-legend"><div className="leg"><div className="leg-line"></div> Efficient Frontier</div><div className="leg"><div className="leg-dot" style={{ background: '#10b981' }}></div> Your Portfolio</div><div className="leg"><div className="leg-dot" style={{ background: '#f59e0b' }}></div> Individual Subnets</div></div>
        </div>
      </div>
      <hr className="divider" />
      <div className="sec fi">
        <div style={{ marginBottom: 44 }}><div className="sec-eye">Intelligence Feed</div><div className="sec-title">Up to the minute.<br/>Always on.</div><p className="sec-sub">Real-time news, macro signals, and subnet events curated by AI and ranked by portfolio impact.</p></div>
        <div className="news-layout">
          <div className="news-stream">
            <div className="ns-hdr"><div className="ns-hdr-title">Live Intelligence Feed</div><div className="live-badge"><span className="live-dot"></span>Live</div></div>
            <div className="ns-scroll">
              {news.length > 0 ? news.slice(0, 5).map((item, i) => {
                const catCls = item.category?.toLowerCase() === 'macro' ? 'c-macro' : item.category?.toLowerCase() === 'subnet' || item.category?.toLowerCase() === 'ecosystem' ? 'c-subnet' : 'c-defi';
                const randW = [85, 72, 60, 50, 28][i % 5];
                const bgW = ['var(--green)', 'var(--cyan)', 'var(--green)', 'var(--amber)', 'var(--indigo)'][i % 5];
                return (
                  <div className="ns-item" key={i}>
                    <div className="ns-top"><span className={`ns-cat ${catCls}`}>{item.category}</span><span className="ns-time">{item.timestamp || 'Recent'}</span></div>
                    <div className="ns-headline">{item.title}</div>
                    <div className="impact"><span>{item.source} Impact</span><div className="impact-bar"><div className="impact-fill" style={{ width: `${randW}%`, background: bgW }}></div></div><span style={{ fontFamily: "'JetBrains Mono',monospace", color: bgW, fontSize: 9 }}>{randW > 70 ? 'HIGH' : randW > 40 ? 'MEDIUM' : 'LOW'}</span></div>
                  </div>
                );
              }).concat(
                Array(Math.max(0, 5 - news.length)).fill(null).map((_,i) => <div className="ns-item" key={`pad-${i}`}><div className="ns-top"><span className="ns-cat c-ai">AI</span><span className="ns-time">{2+i} min ago</span></div><div className="ns-headline">Anthropic releases Claude 3.5 Sonnet &mdash; immediate uplift observed in benchmark scores.</div><div className="impact"><span>Impact</span><div className="impact-bar"><div className="impact-fill" style={{ width: '85%', background: 'var(--green)' }}></div></div><span style={{ fontFamily: "'JetBrains Mono',monospace", color: 'var(--green)', fontSize: 9 }}>HIGH</span></div></div>)
              ) : (
                <>
                  <div className="ns-item"><div className="ns-top"><span className="ns-cat c-macro">Macro</span><span className="ns-time">Just now</span></div><div className="ns-headline">Federal Reserve signals extended pause; risk assets rally as DeFi TVL climbs 4.2% intraday.</div><div className="impact"><span>Impact</span><div className="impact-bar"><div className="impact-fill" style={{ width: '85%', background: 'var(--green)' }}></div></div><span style={{ fontFamily: "'JetBrains Mono',monospace", color: 'var(--green)', fontSize: 9 }}>HIGH</span></div></div>
                  <div className="ns-item"><div className="ns-top"><span className="ns-cat c-subnet">Subnet</span><span className="ns-time">9 min ago</span></div><div className="ns-headline">SN22 Audio subnet reaches 6-month peak emission rate. Validator concentration drops to 0.34 Gini.</div><div className="impact"><span>Impact</span><div className="impact-bar"><div className="impact-fill" style={{ width: '72%', background: 'var(--cyan)' }}></div></div><span style={{ fontFamily: "'JetBrains Mono',monospace", color: 'var(--cyan)', fontSize: 9 }}>MED-HIGH</span></div></div>
                  <div className="ns-item"><div className="ns-top"><span className="ns-cat c-ai">AI</span><span className="ns-time">22 min ago</span></div><div className="ns-headline">Anthropic releases Claude 3.5 Sonnet &mdash; immediate uplift observed in SN1 Prediction miner benchmark scores.</div><div className="impact"><span>Impact</span><div className="impact-bar"><div className="impact-fill" style={{ width: '60%', background: 'var(--green)' }}></div></div><span style={{ fontFamily: "'JetBrains Mono',monospace", color: 'var(--green)', fontSize: 9 }}>MEDIUM</span></div></div>
                  <div className="ns-item"><div className="ns-top"><span className="ns-cat c-defi">DeFi</span><span className="ns-time">38 min ago</span></div><div className="ns-headline">TAO perpetuals open interest hits $340M. Options market pricing 42-day implied vol at 68%.</div><div className="impact"><span>Impact</span><div className="impact-bar"><div className="impact-fill" style={{ width: '50%', background: 'var(--amber)' }}></div></div><span style={{ fontFamily: "'JetBrains Mono',monospace", color: 'var(--amber)', fontSize: 9 }}>MEDIUM</span></div></div>
                </>
              )}
            </div>
          </div>
          <div className="sig-panel">
            <div className="sig-card">
              <div className="sig-card-title">Active Signals</div>
              <div className="sig-list">
                <div className="sig-row"><div><div className="sig-name">SN1 Prediction</div><div className="sig-meta">12.4% APY &middot; Low Vol</div></div><div style={{ textAlign: 'right' }}><div className="sig-val" style={{ color: 'var(--green)' }}>+12.4%</div><div className="sig-badge sb-buy">BUY</div></div></div>
                <div className="sig-row"><div><div className="sig-name">SN22 Audio</div><div className="sig-meta">19.7% APY &middot; Med Vol</div></div><div style={{ textAlign: 'right' }}><div className="sig-val" style={{ color: 'var(--green)' }}>+19.7%</div><div className="sig-badge sb-buy">BUY</div></div></div>
                <div className="sig-row"><div><div className="sig-name">SN18 Compute</div><div className="sig-meta">8.1% APY &middot; Low Vol</div></div><div style={{ textAlign: 'right' }}><div className="sig-val" style={{ color: 'var(--vi)' }}>+8.1%</div><div className="sig-badge sb-hold">HOLD</div></div></div>
                <div className="sig-row"><div><div className="sig-name">SN9 Vision</div><div className="sig-meta">14.2% APY &middot; Med Vol</div></div><div style={{ textAlign: 'right' }}><div className="sig-val" style={{ color: 'var(--amber)' }}>+14.2%</div><div className="sig-badge sb-watch">WATCH</div></div></div>
              </div>
            </div>
            <div className="sig-card">
              <div className="sig-card-title">Market Pulse</div>
              <div className="sig-list">
                <div className="sig-row"><div className="sig-name">TAO / USD</div><div className="sig-val" style={{ color: taoPriceChg >= 0 ? 'var(--green)' : 'var(--red)' }}>${taoPrice.toFixed(2)} {taoPriceChg >= 0 ? '▲' : '▼'}{Math.abs(taoPriceChg).toFixed(1)}%</div></div>
                <div className="sig-row"><div className="sig-name">Market Cap</div><div className="sig-val" style={{ color: 'var(--text)' }}>{fmt(marketCap)}</div></div>
                <div className="sig-row"><div className="sig-name">Active Subnets</div><div className="sig-val" style={{ color: 'var(--text)' }}>{activeSubnets}</div></div>
                <div className="sig-row"><div className="sig-name">24h Volume</div><div className="sig-val" style={{ color: 'var(--green)' }}>{fmt(volume24h)}</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <hr className="divider" />
      <div className="sec fi">
        <div style={{ textAlign: 'center', marginBottom: 44 }}><div className="sec-eye">Competitive Intelligence</div><div className="sec-title">No other platform<br/>comes close.</div></div>
        <div className="comp-card">
          <div className="comp-hdr"><div><div className="comp-hdr-title">Capability Comparison</div><div className="comp-hdr-sub">Bittensor Intelligence vs. existing market alternatives</div></div></div>
          <table>
            <thead><tr><th>Capability</th><th className="feat-col"><div className="th-inner"><span style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 900, color: 'var(--vi)' }}>&#x3C4;</span>Bittensor Intelligence</div></th><th className="other">TaoStats</th><th className="other">Nansen</th></tr></thead>
            <tbody>
              {[
                ['Portfolio Optimization', true, false, false], ['Efficient Frontier Analysis', true, false, false], ['Multi-Dimensional Risk Scoring', true, false, false], ['Institutional Report Generator', true, false, false], ['Real-Time Price Data', true, true, false], ['Sharpe & Beta Calculations', true, false, true], ['Valuation Models (RVT, P/E)', true, false, false], ['Code Quality Metrics', true, false, true], ['Bittensor-Native Focus', true, true, false], ['Regulated Canadian MSB Framework', true, false, false]
              ].map(([name, bi, ts, na], i) => (
                <tr key={i}><td>{name as string}</td><td className="feat-col">{bi ? <span className="chk">&#10003;</span> : <span className="dsh">&mdash;</span>}</td><td className="other">{ts ? <span className="chk">&#10003;</span> : <span className="dsh">&mdash;</span>}</td><td className="other">{na ? <span className="chk">&#10003;</span> : <span className="dsh">&mdash;</span>}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <hr className="divider" />
      <div className="sec fi">
        <div className="cta-wrap">
          <div className="sec-eye" style={{ marginBottom: 18 }}>Get Started Today</div><div className="cta-title">The edge is<br/><em>already live.</em></div><p className="cta-sub">Join institutions allocating intelligently in the decentralized AI economy. Request full platform access.</p>
          <div className="cta-btns"><button className="btn-primary btn-lg" onClick={() => router.push('/dashboard')}>Request Institutional Access</button><button className="btn-ghost btn-lg" onClick={() => router.push('/dashboard')}>Schedule a Demo</button></div>
        </div>
      </div>
      <footer>
        <div>
          <div className="logo"><div className="logo-mark" style={{ width: 28, height: 28, fontSize: 18 }}>&#x3C4;</div><div className="logo-name" style={{ fontSize: 15 }}>DeAI <span>Strategies</span></div></div>
          <div className="foot-copy">&#169; 2026 DeAI Strategies Corp. All Rights Reserved.<br/>Regulated under Canadian MSB Framework. SOC-2 Compliant.</div>
        </div>
        <div className="foot-cols">
          <div className="fc"><span className="fc-head">Platform</span><Link href="/dashboard">Terminal</Link><Link href="/dashboard">Subnets</Link><Link href="/dashboard">Risk Engine</Link><Link href="/dashboard">Reports</Link></div>
          <div className="fc"><span className="fc-head">Company</span><Link href="/dashboard">About</Link><Link href="/dashboard">Institutional</Link><Link href="/dashboard">Compliance</Link></div>
          <div className="fc"><span className="fc-head">Contact</span><a href="mailto:info@deaistrategies.io">info@deaistrategies.io</a><span>+1 (416) 846-5142</span><span>1500 Royal Centre, Vancouver BC</span></div>
        </div>
      </footer>
    </>
  );
}
