import React, { useEffect, useRef } from "react";
import { signOut } from "firebase/auth";
import { auth } from "./firebase";

// ─── DeAI Nexus Pro Dashboard ───────────────────────────────────────────────
// Full port of the standalone HTML dashboard into a React component.
// Chart.js is loaded dynamically on mount; all state lives in the injected JS.
// ─────────────────────────────────────────────────────────────────────────────

const DeAIDashboard: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartJsLoaded = useRef(false);

  // ── Load Chart.js then boot the dashboard ──────────────────────────────────
  useEffect(() => {
    if (chartJsLoaded.current) return;
    chartJsLoaded.current = true;

    const loadScript = (src: string) =>
      new Promise<void>((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
        const s = document.createElement("script");
        s.src = src;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(s);
      });

    const loadStyle = (href: string) => {
      if (document.querySelector(`link[href="${href}"]`)) return;
      const l = document.createElement("link");
      l.rel = "stylesheet"; l.href = href;
      document.head.appendChild(l);
    };

    // Google Fonts
    loadStyle("https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&family=Syne:wght@600;700;800&display=swap");

    loadScript("https://cdn.jsdelivr.net/npm/chart.js")
      .then(() => {
        bootDashboard();
      })
      .catch(console.error);

    return () => {
      // Cleanup interval / charts when component unmounts
      if ((window as any).__dashboardInterval) {
        clearInterval((window as any).__dashboardInterval);
      }
    };
  }, []);

  // ── All dashboard JS injected here ────────────────────────────────────────
  const bootDashboard = () => {
    // --- state ---
    let sortBy = "mc", filterCat = "All";
    let currentTaoPrice = 191.43;
    let taoBtcChart: any = null;
    let currentBtcDays: any = 30;
    let paStakingChart: any = null;
    let paScenarioChart: any = null;
    let currentPeriod = 90;
    let selectedSubnets: number[] = [];
    let projectionChart: any = null;
    let monteCarloChart: any = null;
    let instPortfolio: any[] = [];
    let thematicSector = "all";
    let portfolioAmount = 10000;
    let apiStatus = "connected";
    let lastApiUpdate: Date | null = null;
    let taostatsApiKey = localStorage.getItem("taostats_api_key") || "";
    let apiRefreshInterval: any = null;
    let scoreWeights = { econ:20, net:15, fund:25, liq:15, mom:10, qual:10, val:5 };

    // Expose globals so inline onclick handlers work
    const g = window as any;

    // ─── Subnet Data ──────────────────────────────────────────────────────────
    const subs = [
      {id:64,n:"Chutes",cat:"Compute",mc:91.8,em:356,tao:191.43,pe:1.42,reg:18.79,val:92,trend:"up",score:92,alpha:0.1022,validators:89,miners:312,share:12.4,dailyTao:424.8,uptime:99,emission:12.4,github:88,commits:245,contributors:18,stars:456,testCov:92,docScore:90,momentum:18.79,liquidity:95,quality:92,economic:94,network:95,fundamental:94,taoPool:228000,staked:2300000},
      {id:51,n:"Lium",cat:"Compute",mc:62.6,em:285,tao:191.43,pe:1.38,reg:14.2,val:88,trend:"up",score:88,alpha:0.0756,validators:78,miners:278,share:9.9,dailyTao:339.2,uptime:98,emission:9.9,github:82,commits:212,contributors:15,stars:398,testCov:88,docScore:85,momentum:14.2,liquidity:92,quality:88,economic:90,network:92,fundamental:90,taoPool:168400,staked:1900000},
      {id:4,n:"Targon",cat:"Compute",mc:48.2,em:232,tao:191.43,pe:1.44,reg:8.5,val:87,trend:"stable",score:86,alpha:0.0524,validators:76,miners:262,share:8.1,dailyTao:277.5,uptime:98,emission:8.1,github:80,commits:198,contributors:14,stars:378,testCov:85,docScore:82,momentum:8.5,liquidity:90,quality:85,economic:87,network:89,fundamental:86,taoPool:128600,staked:2000000},
      {id:62,n:"Ridges",cat:"Code",mc:46.8,em:225,tao:191.43,pe:1.45,reg:12.8,val:86,trend:"up",score:87,alpha:0.0645,validators:74,miners:256,share:7.8,dailyTao:267.2,uptime:98,emission:7.8,github:85,commits:234,contributors:16,stars:412,testCov:90,docScore:88,momentum:12.8,liquidity:88,quality:87,economic:88,network:90,fundamental:88,taoPool:124500,staked:2100000},
      {id:56,n:"Gradients",cat:"Training",mc:54.1,em:258,tao:191.43,pe:1.46,reg:22.4,val:85,trend:"up",score:85,alpha:0.1640,validators:71,miners:245,share:7.2,dailyTao:246.7,uptime:97,emission:7.2,github:78,commits:186,contributors:13,stars:356,testCov:82,docScore:80,momentum:22.4,liquidity:86,quality:82,economic:86,network:87,fundamental:85,taoPool:145200,staked:1800000},
      {id:19,n:"Nineteen",cat:"Inference",mc:42.5,em:205,tao:191.43,pe:1.43,reg:10.2,val:84,trend:"up",score:84,alpha:0.0589,validators:70,miners:238,share:6.5,dailyTao:222.7,uptime:97,emission:6.5,github:76,commits:172,contributors:12,stars:334,testCov:80,docScore:78,momentum:10.2,liquidity:85,quality:81,economic:85,network:86,fundamental:84,taoPool:113800,staked:1750000},
      {id:120,n:"Affine",cat:"Inference",mc:37.4,em:195,tao:191.43,pe:1.28,reg:11.05,val:85,trend:"up",score:86,alpha:0.0832,validators:72,miners:245,share:5.8,dailyTao:198.7,uptime:98,emission:5.8,github:78,commits:189,contributors:14,stars:342,testCov:85,docScore:82,momentum:11.05,liquidity:88,quality:85,economic:88,network:88,fundamental:86,taoPool:82100,staked:1500000},
      {id:1,n:"Text Prompting",cat:"Inference",mc:38.5,em:188,tao:191.43,pe:1.41,reg:5.8,val:86,trend:"stable",score:85,alpha:0.0512,validators:82,miners:285,share:5.4,dailyTao:185.0,uptime:99,emission:5.4,github:84,commits:198,contributors:15,stars:412,testCov:88,docScore:86,momentum:5.8,liquidity:92,quality:86,economic:86,network:90,fundamental:86,taoPool:102400,staked:1850000},
      {id:8,n:"Vanta",cat:"Finance",mc:34.7,em:181,tao:191.43,pe:1.32,reg:3.74,val:84,trend:"up",score:85,alpha:0.0437,validators:68,miners:215,share:4.9,dailyTao:167.9,uptime:98,emission:4.9,github:75,commits:178,contributors:12,stars:312,testCov:82,docScore:80,momentum:3.74,liquidity:85,quality:82,economic:86,network:86,fundamental:84,taoPool:95600,staked:2200000},
      {id:18,n:"Cortex.t",cat:"Compute",mc:35.2,em:172,tao:191.43,pe:1.42,reg:7.2,val:83,trend:"up",score:82,alpha:0.0478,validators:68,miners:212,share:4.5,dailyTao:154.2,uptime:97,emission:4.5,github:74,commits:165,contributors:11,stars:298,testCov:78,docScore:76,momentum:7.2,liquidity:84,quality:79,economic:83,network:84,fundamental:82,taoPool:94200,staked:1680000},
      {id:44,n:"Score",cat:"Data",mc:29.7,em:155,tao:191.43,pe:1.35,reg:7.86,val:82,trend:"up",score:83,alpha:0.0361,validators:65,miners:198,share:3.8,dailyTao:130.2,uptime:97,emission:3.8,github:72,commits:156,contributors:11,stars:287,testCov:78,docScore:76,momentum:7.86,liquidity:82,quality:80,economic:84,network:84,fundamental:82,taoPool:53300,staked:2800000},
      {id:6,n:"Nous Research",cat:"Research",mc:32.8,em:162,tao:191.43,pe:1.40,reg:8.9,val:82,trend:"up",score:82,alpha:0.0456,validators:65,miners:198,share:3.5,dailyTao:119.9,uptime:97,emission:3.5,github:78,commits:175,contributors:12,stars:328,testCov:80,docScore:78,momentum:8.9,liquidity:82,quality:80,economic:83,network:84,fundamental:82,taoPool:87600,staked:1580000},
      {id:21,n:"FileTAO",cat:"Storage",mc:28.4,em:142,tao:191.43,pe:1.38,reg:4.5,val:78,trend:"stable",score:78,alpha:0.0392,validators:58,miners:178,share:3.2,dailyTao:109.6,uptime:96,emission:3.2,github:68,commits:132,contributors:9,stars:245,testCov:72,docScore:70,momentum:4.5,liquidity:78,quality:74,economic:79,network:78,fundamental:78,taoPool:75800,staked:1420000},
      {id:13,n:"Dataverse",cat:"Data",mc:24.6,em:125,tao:191.43,pe:1.36,reg:3.8,val:75,trend:"stable",score:75,alpha:0.0345,validators:52,miners:156,share:2.8,dailyTao:95.9,uptime:95,emission:2.8,github:64,commits:118,contributors:8,stars:212,testCov:68,docScore:66,momentum:3.8,liquidity:74,quality:70,economic:76,network:75,fundamental:75,taoPool:65800,staked:1280000},
      {id:5,n:"Open Kaito",cat:"Social",mc:22.4,em:115,tao:191.43,pe:1.35,reg:6.2,val:72,trend:"up",score:72,alpha:0.0312,validators:48,miners:142,share:2.4,dailyTao:82.2,uptime:94,emission:2.4,github:60,commits:105,contributors:7,stars:192,testCov:64,docScore:62,momentum:6.2,liquidity:70,quality:68,economic:73,network:72,fundamental:72,taoPool:59800,staked:1150000},
    ];
    g.subs = subs;

    // ─── News Data ────────────────────────────────────────────────────────────
    const news = [
      {tg:"PROTOCOL",t:"Bittensor mainnet upgrade complete: De-registration features now live. Network stability improved 23%.",s:"TAO Daily",url:"https://taodaily.io",tm:"2 min ago",impact:"HIGH",impactPct:92},
      {tg:"SUBNET",t:"Chutes (SN64) launches enterprise API tier with SOC2 compliance. $12M TVL added in 24 hours.",s:"TAO Daily",url:"https://taodaily.io",tm:"15 min ago",impact:"HIGH",impactPct:85},
      {tg:"MACRO",t:"Federal Reserve signals extended pause; risk assets rally as DeFi TVL climbs 4.2% intraday.",s:"CoinTelegraph",url:"https://cointelegraph.com",tm:"22 min ago",impact:"HIGH",impactPct:80},
      {tg:"INSTITUTIONAL",t:"Grayscale files S-1 for Bittensor spot ETF (GTAO) with SEC. Decision expected Q3 2026.",s:"TAO Daily",url:"https://taodaily.io",tm:"35 min ago",impact:"HIGH",impactPct:95},
      {tg:"SUBNET",t:"SN22 Datura reaches 6-month peak emission rate. Validator Gini drops to 0.34.",s:"TaoStats",url:"https://taostats.io",tm:"48 min ago",impact:"MED-HIGH",impactPct:72},
      {tg:"AI",t:"Anthropic releases Claude 4 — immediate uplift in SN1 Text Prompting benchmark scores.",s:"@AnthropicAI",url:"https://x.com/AnthropicAI",tm:"1h ago",impact:"MEDIUM",impactPct:65},
      {tg:"MARKET",t:"TAO 24h trading volume surges 45% to $89M as institutional interest grows post-halving.",s:"TAO Daily",url:"https://taodaily.io",tm:"2h ago",impact:"MED-HIGH",impactPct:70},
      {tg:"DEFI",t:"TAO perpetuals open interest hits $340M. 42-day implied volatility at 68%.",s:"Deribit",url:"https://deribit.com",tm:"2h ago",impact:"MEDIUM",impactPct:55},
      {tg:"PROTOCOL",t:"Opentensor Foundation announces $25M ecosystem fund for subnet development grants.",s:"TAO Daily",url:"https://taodaily.io",tm:"4h ago",impact:"HIGH",impactPct:88},
    ];

    // ─── Helper fns ───────────────────────────────────────────────────────────
    const calcAPY = (s: any) => {
      if (s.liveApy !== undefined) return s.liveApy;
      const base = 18, emBonus = (s.share/5)*8, compPenalty = Math.max(0,(s.validators-30)*0.1), qBonus = (s.score/100)*5;
      let apy = base + emBonus - compPenalty + qBonus;
      if (s.cat==="Inference") apy*=1.1;
      if (s.cat==="Storage") apy*=0.95;
      if (s.trend==="up") apy*=1.05;
      return Math.max(8, Math.min(85, apy));
    };
    const calcVolatility = (s: any) => Math.max(15, 45+(100-s.liquidity)*0.3+Math.abs(s.momentum)*0.5-(100-s.score)*0.2);
    const calcSharpe = (s: any) => Math.max(0.1, Math.min(2.0, (calcAPY(s)-5)/Math.max(10, calcVolatility(s))));
    g.calcAPY = calcAPY; g.calcSharpe = calcSharpe; g.calcVolatility = calcVolatility;

    const uel = (id: string, v: string) => { const e=document.getElementById(id); if(e) e.textContent=v; };

    // ─── View switching ───────────────────────────────────────────────────────
    g.showView = (v: string) => {
      document.querySelectorAll(".nav-i").forEach(e=>e.classList.remove("act"));
      document.querySelector(`.nav-i[data-v="${v}"]`)?.classList.add("act");
      document.querySelectorAll(".view").forEach(e=>e.classList.remove("act"));
      document.getElementById(`${v}-view`)?.classList.add("act");
      // Lazy-init charts for some views
      if (v==="taoflow") initTaoFlow();
      if (v==="onchain") initOnChainCharts();
      if (v==="portfoliopro") runOptimization();
      if (v==="portfolio") { initSubnetSelector(); updatePortfolioAnalytics(); }
    };

    // ─── Price & KPIs ─────────────────────────────────────────────────────────
    const updatePrices = () => {
      const v = currentTaoPrice + (Math.random()-0.5)*1.5;
      currentTaoPrice = Math.max(150, Math.min(250, v));
      uel("taoP","$"+currentTaoPrice.toFixed(2));
      uel("taoPriceLive","$"+currentTaoPrice.toFixed(2));
      uel("tradeVol","$"+(92.7+(Math.random()-0.5)*5).toFixed(1)+"M");
      uel("netCap","$"+(currentTaoPrice*9600000/1e9).toFixed(2)+"B");
    };
    g.updatePrices = updatePrices;

    const updateTs = () => { uel("liveTs", new Date().toLocaleTimeString()); };
    g.updateTs = updateTs;

    const updateKPIs = () => {
      const tmc=subs.reduce((s,x)=>s+x.mc,0);
      uel("kpi-tmc","$"+tmc.toFixed(1)+"M");
      uel("kpi-sn",""+subs.length);
      const avgPe=subs.reduce((s,x)=>s+x.pe,0)/subs.length;
      uel("kpi-pe",avgPe.toFixed(2)+"x");
    };

    // ─── Ticker ───────────────────────────────────────────────────────────────
    const initTicker = () => {
      const items = subs.slice(0,15).map(s=>{
        const c=s.momentum>=0?"+":"", color=s.momentum>=0?"var(--green)":"var(--rose)";
        return `<div class="ticker-item"><span class="ticker-name">${s.n}</span><span class="ticker-val" style="color:${color}">${c}${s.momentum.toFixed(1)}%</span></div>`;
      }).join("");
      const el=document.getElementById("ticker");
      if(el) el.innerHTML=items+items;
    };

    // ─── Pills & List ─────────────────────────────────────────────────────────
    const renderPills = () => {
      const cats=["All",...new Set(subs.map(s=>s.cat))];
      const el=document.getElementById("pillG");
      if(el) el.innerHTML=cats.map(c=>`<div class="pill ${c===filterCat?"act":""}" onclick="window.filterBy('${c}')">${c}</div>`).join("");
    };
    g.filterBy = (c: string) => { filterCat=c; renderPills(); renderList(); };
    g.sortList = (s: string) => { sortBy=s; const m=document.getElementById("srtM"); if(m) m.classList.remove("open"); renderList(); };

    const renderList = () => {
      let list=[...subs];
      if(filterCat!=="All") list=list.filter(s=>s.cat===filterCat);
      list.sort((a,b)=>{
        if(sortBy==="mc") return b.mc-a.mc;
        if(sortBy==="em") return b.share-a.share;
        if(sortBy==="pe") return a.pe-b.pe;
        if(sortBy==="score") return b.score-a.score;
        if(sortBy==="alpha") return b.alpha-a.alpha;
        if(sortBy==="apy") return calcAPY(b)-calcAPY(a);
        if(sortBy==="sharpe") return calcSharpe(b)-calcSharpe(a);
        return 0;
      });
      const el=document.getElementById("subL");
      if(!el) return;
      el.innerHTML=list.map((s,i)=>{
        const grade=s.score>=80?"A+":s.score>=75?"A":s.score>=70?"A-":s.score>=65?"B+":s.score>=60?"B":s.score>=55?"B-":s.score>=50?"C+":s.score>=40?"C":"D";
        const gc=grade[0]==="A"?"grade-a":grade[0]==="B"?"grade-b":grade[0]==="C"?"grade-c":"grade-d";
        const sc=s.score>=70?"var(--green)":s.score>=50?"var(--cyan)":"var(--amber)";
        const apy=calcAPY(s), ac=apy>=25?"var(--green)":apy>=15?"var(--amber)":"var(--rose)";
        const sh=calcSharpe(s), shc=sh>=1.0?"var(--green)":sh>=0.5?"var(--amber)":"var(--rose)";
        return `<tr onclick="window.toggleRow('row-${s.id}')">
          <td class="rank">${i+1}</td>
          <td><div class="subnet-icon">SN${s.id}</div></td>
          <td class="n"><div style="font-weight:600">${s.n}</div><div style="font-size:11px;color:var(--mute)">${s.cat}</div></td>
          <td><span class="grade ${gc}">${grade}</span></td>
          <td class="val" style="color:${sc};font-weight:700">${s.score}</td>
          <td class="val" style="color:var(--cyan)">${s.alpha.toFixed(4)}τ</td>
          <td class="val">$${s.mc.toFixed(1)}M</td>
          <td class="val" style="color:var(--cyan)">${s.share.toFixed(2)}%</td>
          <td class="val" style="color:${ac};font-weight:600">${apy.toFixed(1)}%</td>
          <td class="val" style="color:var(--green)">${s.alpha.toFixed(2)}</td>
          <td class="val">${s.fundamental}</td>
          <td class="val" style="color:${shc};font-weight:600">${sh.toFixed(2)}</td>
        </tr>
        <tr class="row-exp" id="row-${s.id}">
          <td colspan="12" style="padding:20px 12px">
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:16px">
              <div class="exp-sec"><div class="exp-sec-t">Valuation</div>
                <div class="exp-metric"><span class="exp-m-l">α/EM</span><span class="exp-m-v" style="color:${s.alpha<0.05?"var(--green)":s.alpha<0.1?"var(--amber)":"var(--rose)"}">${s.alpha.toFixed(3)}</span></div>
                <div class="exp-metric"><span class="exp-m-l">P/E</span><span class="exp-m-v">${s.pe.toFixed(2)}x</span></div>
                <div class="exp-metric"><span class="exp-m-l">Sharpe</span><span class="exp-m-v" style="color:${shc}">${sh.toFixed(2)}</span></div>
                <div class="exp-metric"><span class="exp-m-l">APY</span><span class="exp-m-v" style="color:${ac}">${apy.toFixed(1)}%</span></div>
              </div>
              <div class="exp-sec"><div class="exp-sec-t">Network</div>
                <div class="exp-metric"><span class="exp-m-l">Validators</span><span class="exp-m-v">${s.validators}</span></div>
                <div class="exp-metric"><span class="exp-m-l">Miners</span><span class="exp-m-v">${s.miners}</span></div>
                <div class="exp-metric"><span class="exp-m-l">Emission %</span><span class="exp-m-v" style="color:var(--cyan)">${s.share.toFixed(2)}%</span></div>
                <div class="exp-metric"><span class="exp-m-l">Daily TAO</span><span class="exp-m-v">${s.dailyTao.toFixed(1)}τ</span></div>
              </div>
              <div class="exp-sec"><div class="exp-sec-t">Development (${s.github}/100)</div>
                <div class="exp-metric"><span class="exp-m-l">Commits</span><span class="exp-m-v">${s.commits}</span></div>
                <div class="exp-metric"><span class="exp-m-l">Contributors</span><span class="exp-m-v">${s.contributors}</span></div>
                <div class="exp-metric"><span class="exp-m-l">Stars</span><span class="exp-m-v">${s.stars}</span></div>
                <div class="exp-metric"><span class="exp-m-l">Test Cov</span><span class="exp-m-v">${s.testCov}%</span></div>
              </div>
            </div>
          </td>
        </tr>`;
      }).join("");
    };

    g.toggleRow = (id: string) => {
      document.getElementById(id)?.classList.toggle("show");
    };

    // ─── Top Performers ───────────────────────────────────────────────────────
    const renderTopPerformers = () => {
      const sortV = (document.getElementById("perfSort") as HTMLSelectElement)?.value || "momentum";
      let sorted=[...subs].filter(s=>s.mc>10);
      if(sortV==="momentum") sorted.sort((a,b)=>b.momentum-a.momentum);
      else if(sortV==="apy") sorted.sort((a,b)=>calcAPY(b)-calcAPY(a));
      else sorted.sort((a,b)=>calcSharpe(b)-calcSharpe(a));
      const top=sorted.slice(0,4);
      const el=document.getElementById("topPerfGrid");
      if(!el) return;
      el.innerHTML=top.map(s=>{
        const apy=calcAPY(s), sh=calcSharpe(s);
        const sig=s.momentum>=10?"BUY":s.momentum>=0?"HOLD":"WATCH";
        const sigC=sig==="BUY"?"var(--green)":sig==="HOLD"?"var(--amber)":"var(--violet)";
        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid var(--bdr)">
          <div><div style="font-weight:700">SN${s.id} ${s.n}</div><div style="font-size:11px;color:var(--mute)">${apy.toFixed(1)}% APY · Sharpe ${sh.toFixed(2)}</div></div>
          <div style="display:flex;align-items:center;gap:12px">
            <div style="font-size:15px;font-weight:700;color:${s.momentum>=0?"var(--green)":"var(--rose)"}">${s.momentum>=0?"+":""}${s.momentum.toFixed(1)}%</div>
            <span style="padding:4px 10px;border-radius:4px;font-size:10px;font-weight:600;background:${sig==="BUY"?"rgba(0,255,153,0.12)":sig==="HOLD"?"rgba(255,214,10,0.12)":"rgba(191,90,242,0.12)"};border:1px solid ${sig==="BUY"?"rgba(0,255,153,0.3)":sig==="HOLD"?"rgba(255,214,10,0.3)":"rgba(191,90,242,0.3)"};color:${sigC}">${sig}</span>
          </div>
        </div>`;
      }).join("");
    };
    g.renderTopPerformers = renderTopPerformers;

    // ─── News ─────────────────────────────────────────────────────────────────
    const renderNews = () => {
      const tagColors: Record<string,any> = {
        PROTOCOL:{bg:"rgba(191,90,242,0.15)",border:"rgba(191,90,242,0.4)",color:"#bf5af2",icon:"⚙️"},
        SUBNET:{bg:"rgba(0,255,153,0.15)",border:"rgba(0,255,153,0.4)",color:"#00ff99",icon:"⬡"},
        MACRO:{bg:"rgba(0,240,255,0.15)",border:"rgba(0,240,255,0.4)",color:"#00f0ff",icon:"🌐"},
        AI:{bg:"rgba(255,214,10,0.15)",border:"rgba(255,214,10,0.4)",color:"#ffd60a",icon:"🤖"},
        DEFI:{bg:"rgba(255,123,44,0.15)",border:"rgba(255,123,44,0.4)",color:"#ff7b2c",icon:"💰"},
        MARKET:{bg:"rgba(0,240,255,0.15)",border:"rgba(0,240,255,0.4)",color:"#00f0ff",icon:"📊"},
        INSTITUTIONAL:{bg:"rgba(16,185,129,0.15)",border:"rgba(16,185,129,0.4)",color:"#10b981",icon:"🏛️"},
      };
      const getIC=(pct:number)=>pct>=80?"#00ff99":pct>=60?"#00f0ff":pct>=40?"#ffd60a":"#606075";
      const getIL=(pct:number)=>pct>=80?"HIGH":pct>=60?"MED-HIGH":pct>=40?"MEDIUM":"LOW";
      const el=document.getElementById("newsG");
      if(!el) return;
      el.innerHTML=news.map(n=>{
        const tc=tagColors[n.tg]||tagColors.MACRO;
        const ic=getIC(n.impactPct||50);
        return `<div style="padding:20px 0;border-bottom:1px solid var(--bdr)">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
            <span style="padding:4px 12px;background:${tc.bg};border:1px solid ${tc.border};border-radius:4px;font-size:10px;font-weight:700;color:${tc.color}">${tc.icon} ${n.tg}</span>
            <span style="font-size:11px;color:var(--mute);font-family:'IBM Plex Mono',monospace">${n.tm}</span>
          </div>
          <a href="${n.url}" target="_blank" rel="noopener" style="display:block;font-size:15px;color:var(--txt);line-height:1.6;margin-bottom:16px;font-weight:500;text-decoration:none">${n.t}</a>
          <div style="display:flex;align-items:center;gap:12px">
            <span style="font-size:10px;color:var(--mute);width:50px">Impact</span>
            <div style="flex:1;height:6px;background:var(--bg4);border-radius:3px;overflow:hidden">
              <div style="width:${n.impactPct||50}%;height:100%;background:${ic};border-radius:3px"></div>
            </div>
            <span style="font-size:11px;color:${ic};font-weight:700;width:75px;text-align:right">${getIL(n.impactPct||50)}</span>
          </div>
        </div>`;
      }).join("");
    };

    // ─── Overview Charts ──────────────────────────────────────────────────────
    const initCharts = () => {
      const Chart = (window as any).Chart;
      if (!Chart) return;

      // Market Cap Bar
      const mcEl = document.getElementById("mcapChart");
      if (mcEl) {
        const top=[...subs].sort((a,b)=>b.mc-a.mc).slice(0,10);
        new Chart((mcEl as HTMLCanvasElement).getContext("2d"),{
          type:"bar",
          data:{labels:top.map(s=>s.n),datasets:[{data:top.map(s=>s.mc),backgroundColor:"rgba(59,130,246,0.6)",borderColor:"rgba(59,130,246,1)",borderWidth:1,borderRadius:4}]},
          options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:"rgba(255,255,255,0.05)"},ticks:{color:"#606075",font:{size:9},maxRotation:45}},y:{grid:{color:"rgba(255,255,255,0.05)"},ticks:{color:"#606075",callback:(v:any)=>"$"+v+"M"}}}}
        });
      }

      // Category Doughnut
      const catEl = document.getElementById("catChart");
      if (catEl) {
        const catData: Record<string,number>={};
        subs.forEach(s=>{catData[s.cat]=(catData[s.cat]||0)+s.mc;});
        const cats=Object.keys(catData).sort((a,b)=>catData[b]-catData[a]);
        const colors=["rgba(59,130,246,0.7)","rgba(6,182,212,0.7)","rgba(16,185,129,0.7)","rgba(245,158,11,0.7)","rgba(139,92,246,0.7)","rgba(244,63,94,0.7)","rgba(132,204,22,0.7)","rgba(236,72,153,0.7)"];
        new Chart((catEl as HTMLCanvasElement).getContext("2d"),{
          type:"doughnut",
          data:{labels:cats,datasets:[{data:cats.map(c=>catData[c]),backgroundColor:colors.slice(0,cats.length),borderWidth:0}]},
          options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"right",labels:{color:"#a0a0b8",font:{size:10},boxWidth:12,padding:6}}}}
        });
      }

      // Valuation Distribution
      const valEl = document.getElementById("valChart");
      if (valEl) {
        const under=subs.filter(s=>s.alpha<0.05).length;
        const fair=subs.filter(s=>s.alpha>=0.05&&s.alpha<0.1).length;
        const over=subs.filter(s=>s.alpha>=0.1).length;
        new Chart((valEl as HTMLCanvasElement).getContext("2d"),{
          type:"doughnut",
          data:{labels:["Undervalued (<0.05)","Fair Value (0.05-0.1)","Expensive (>0.1)"],datasets:[{data:[under,fair,over],backgroundColor:["rgba(16,185,129,0.7)","rgba(245,158,11,0.7)","rgba(244,63,94,0.7)"],borderWidth:0}]},
          options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"right",labels:{color:"#a0a0b8",font:{size:10},boxWidth:12,padding:6}}}}
        });
      }
    };

    // ─── TAO/BTC Chart ────────────────────────────────────────────────────────
    const generateFallback = (days: number) => {
      const data=[], now=Date.now(), ms=86400000, pts=days<=1?24:days<=7?days*4:Math.min(days,365), interval=(days*ms)/pts;
      let ratio=0.0028+(Math.random()-0.5)*0.001;
      for(let i=pts;i>=0;i--){
        ratio+=((Math.random()-0.48)*0.0001);
        ratio=Math.max(0.0015,Math.min(0.006,ratio));
        data.push({timestamp:now-(i*interval),ratio});
      }
      return data;
    };

    const updateBtcChart = (days: any) => {
      currentBtcDays=days;
      const numDays=days==="max"?730:days;
      document.querySelectorAll("#btcTimePills .time-pill").forEach(p=>p.classList.remove("act"));
      const activeBtn=document.querySelector(`#btcTimePills .time-pill[data-days="${days}"]`);
      if(activeBtn) activeBtn.classList.add("act");
      const loadEl=document.getElementById("btcChartLoading");
      if(loadEl) loadEl.style.display="none";
      const ratioData=generateFallback(numDays);
      if(!ratioData.length) return;
      const first=ratioData[0].ratio, last=ratioData[ratioData.length-1].ratio;
      const change=((last-first)/first)*100;
      uel("taoBtcCurrent",last.toFixed(6)+" BTC");
      const chEl=document.getElementById("taoBtcChange");
      if(chEl){chEl.textContent=(change>=0?"+":"")+change.toFixed(2)+"%";chEl.style.color=change>=0?"var(--green)":"var(--rose)";}
      const canvas=document.getElementById("taoBtcChart") as HTMLCanvasElement;
      if(!canvas) return;
      const ctx=canvas.getContext("2d")!;
      if(taoBtcChart) taoBtcChart.destroy();
      const grad=ctx.createLinearGradient(0,0,0,300);
      grad.addColorStop(0,"rgba(139,92,246,0.3)");grad.addColorStop(1,"rgba(139,92,246,0)");
      const Chart=(window as any).Chart;
      taoBtcChart=new Chart(ctx,{
        type:"line",
        data:{labels:ratioData.map((_:any,i:number)=>i%Math.floor(ratioData.length/6)===0?new Date(ratioData[i].timestamp).toLocaleDateString([],{month:"short",day:"numeric"}):""),datasets:[{data:ratioData.map((d:any)=>d.ratio),borderColor:"#8b5cf6",backgroundColor:grad,fill:true,tension:0.4,pointRadius:0,borderWidth:2}]},
        options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false},ticks:{color:"#606075",maxTicksLimit:6}},y:{grid:{color:"rgba(255,255,255,0.05)"},ticks:{color:"#606075",callback:(v:any)=>Number(v).toFixed(5)}}}}
      });
    };
    g.updateBtcChart = updateBtcChart;

    // ─── Calculator fns ───────────────────────────────────────────────────────
    g.calcFV = () => {
      const annualOx=parseFloat((document.getElementById("c-opex") as HTMLInputElement)?.value)||0;
      const em=parseFloat((document.getElementById("c-em") as HTMLInputElement)?.value)||1;
      const tp=parseFloat((document.getElementById("c-tp") as HTMLInputElement)?.value)||1;
      const dailyOx=annualOx/365, fv=dailyOx/em, pr=((tp-fv)/fv*100);
      uel("fv-r","$"+fv.toFixed(2));uel("fv-s","$"+dailyOx.toLocaleString(undefined,{maximumFractionDigits:0}));
      uel("fv-p",(pr>=0?"+":"")+pr.toFixed(1)+"%");uel("fv-pv","$"+(em*tp*365/1e6).toFixed(1)+"M");
      uel("fv-sig",pr<0?"UNDER":"OVER");
      const sigEl=document.getElementById("fv-sig"); if(sigEl) sigEl.style.color=pr<0?"var(--green)":"var(--rose)";
      const pEl=document.getElementById("fv-p"); if(pEl) pEl.style.color=pr<0?"var(--green)":"var(--rose)";
    };

    g.calcDCF = () => {
      const em=parseFloat((document.getElementById("d-em") as HTMLInputElement)?.value)||1;
      const tao=parseFloat((document.getElementById("d-tao") as HTMLInputElement)?.value)||180.80;
      const gr=parseFloat((document.getElementById("d-g") as HTMLInputElement)?.value)/100||0.05;
      const dr=parseFloat((document.getElementById("d-d") as HTMLInputElement)?.value)/100||0.25;
      const mc=parseFloat((document.getElementById("d-mc") as HTMLInputElement)?.value)||1;
      const y=parseFloat((document.getElementById("d-y") as HTMLInputElement)?.value)||5;
      let npv=0,dv=em*tao;
      for(let i=1;i<=y;i++){dv*=(1+gr);npv+=dv*365/Math.pow(1+dr,i);}
      const fv=npv/1e6, rt=fv/mc, up=(rt-1)*100;
      uel("dcf-r","$"+fv.toFixed(1)+"M");uel("dcf-rt",rt.toFixed(2)+"x");uel("dcf-up",(up>=0?"+":"")+up.toFixed(0)+"%");uel("dcf-sig",rt>1?"UNDER":"OVER");
      const rtEl=document.getElementById("dcf-rt"); if(rtEl) rtEl.style.color=rt>1?"var(--green)":"var(--rose)";
      const upEl=document.getElementById("dcf-up"); if(upEl) upEl.style.color=up>0?"var(--green)":"var(--rose)";
      const sigEl=document.getElementById("dcf-sig"); if(sigEl) sigEl.style.color=rt>1?"var(--green)":"var(--rose)";
    };

    g.updateWeights = () => {
      ["econ","net","fund","liq","mom","qual","val"].forEach(k=>{
        const v=parseInt((document.getElementById(`s-${k}`) as HTMLInputElement)?.value||"0");
        (scoreWeights as any)[k]=v;
        uel(`w-${k}`,v+"%");
      });
      const total=Object.values(scoreWeights).reduce((a,b)=>a+b,0);
      const tw=document.getElementById("total-weight");
      if(tw){tw.textContent=total+"%";tw.style.color=total===100?"var(--green)":"var(--rose)";}
    };

    // ─── Portfolio Analytics ──────────────────────────────────────────────────
    const initSubnetSelector = () => {
      const container=document.getElementById("pa-subnetSelector");
      if(!container) return;
      const top=[...subs].sort((a,b)=>calcAPY(b)-calcAPY(a)).slice(0,16);
      const colors=["#3b82f6","#00f0ff","#10b981","#fbbf24","#8b5cf6","#f43f5e","#06b6d4","#f59e0b"];
      if(selectedSubnets.length===0) selectedSubnets=top.slice(0,8).map(s=>s.id);
      container.innerHTML=top.map((s,i)=>{
        const sel=selectedSubnets.includes(s.id);
        return `<button onclick="window.toggleSubnet(${s.id})" style="padding:6px 12px;background:${sel?colors[i%8]+"33":"var(--bg3)"};border:1px solid ${sel?colors[i%8]:"var(--bdr)"};border-radius:6px;color:${sel?colors[i%8]:"var(--txt2)"};font-size:11px;cursor:pointer;transition:all 0.2s">${s.n} <span style="opacity:0.6">${calcAPY(s).toFixed(1)}%</span></button>`;
      }).join("");
    };
    g.initSubnetSelector = initSubnetSelector;
    g.toggleSubnet = (id: number) => {
      if(selectedSubnets.includes(id)) selectedSubnets=selectedSubnets.filter(s=>s!==id);
      else if(selectedSubnets.length<8) selectedSubnets.push(id);
      initSubnetSelector(); updatePortfolioAnalytics();
    };
    g.selectTopSubnets = () => {
      selectedSubnets=[...subs].sort((a,b)=>calcAPY(b)-calcAPY(a)).slice(0,8).map(s=>s.id);
      initSubnetSelector(); updatePortfolioAnalytics();
    };

    const updatePortfolioAnalytics = () => {
      const holdings=parseFloat((document.getElementById("pa-holdings") as HTMLInputElement)?.value)||10000;
      const taoPrice=currentTaoPrice||191.43, avgApy=14.77;
      const usd=holdings*taoPrice, annYield=holdings*(avgApy/100), monthly=(annYield*taoPrice)/12;
      uel("pa-usdvalue","$"+usd.toLocaleString("en-US",{maximumFractionDigits:0}));
      uel("pa-taoPrice","$"+taoPrice.toFixed(2));
      uel("pa-annualYield",""+Math.round(annYield).toLocaleString());
      uel("pa-avgApy",avgApy.toFixed(2));
      uel("pa-monthlyUsd","$"+monthly.toLocaleString("en-US",{maximumFractionDigits:0}));
      uel("pa-holdingsRef",""+holdings.toLocaleString());
      renderStakingTable(holdings, taoPrice);
      renderPAScenarios(holdings, taoPrice);
      updateStakingChart(currentPeriod);
    };
    g.updatePortfolioAnalytics = updatePortfolioAnalytics;

    const renderStakingTable = (holdings: number, taoPrice: number) => {
      const container=document.getElementById("pa-stakingTable");
      if(!container) return;
      const selSubs=subs.filter(s=>selectedSubnets.includes(s.id));
      if(!selSubs.length) return;
      container.innerHTML=selSubs.map(s=>{
        const apy=calcAPY(s), daily=holdings*(apy/100)/365, monthly=daily*30, annual=holdings*(apy/100);
        return `<tr style="border-bottom:1px solid var(--bdr)">
          <td style="padding:12px 8px;font-size:12px">${s.n} <span style="color:var(--mute)">SN${s.id}</span></td>
          <td style="padding:12px 8px;text-align:right;color:var(--amber);font-weight:600">${apy.toFixed(2)}%</td>
          <td style="padding:12px 8px;text-align:right;font-family:'IBM Plex Mono',monospace">${daily.toFixed(4)} τ</td>
          <td style="padding:12px 8px;text-align:right;font-family:'IBM Plex Mono',monospace">${monthly.toFixed(3)} τ</td>
          <td style="padding:12px 8px;text-align:right;font-family:'IBM Plex Mono',monospace">${annual.toFixed(2)} τ</td>
          <td style="padding:12px 8px;text-align:right;color:var(--cyan);font-weight:600">$${(monthly*taoPrice).toLocaleString("en-US",{maximumFractionDigits:0})}</td>
          <td style="padding:12px 8px;text-align:right;color:var(--green);font-weight:600">$${(annual*taoPrice).toLocaleString("en-US",{maximumFractionDigits:0})}</td>
          <td style="padding:12px 8px;text-align:right">${annual.toFixed(2)} τ</td>
        </tr>`;
      }).join("");
    };

    const renderPAScenarios = (holdings: number, taoPrice: number) => {
      const container=document.getElementById("pa-scenarios");
      if(!container) return;
      const scenarios=[
        {name:"Bear -50%",mult:0.5,color:"#f43f5e",icon:"🐻"},
        {name:"Correction -25%",mult:0.75,color:"#f59e0b",icon:"📉"},
        {name:"Current",mult:1.0,color:"#fbbf24",icon:"📍"},
        {name:"Bull +50%",mult:1.5,color:"#10b981",icon:"🐂"},
        {name:"Moon +200%",mult:3.0,color:"#00f0ff",icon:"🌙"},
        {name:"Moonshot +333%",mult:4.33,color:"#a855f7",icon:"🚀"},
      ];
      container.innerHTML=scenarios.map(sc=>{
        const price=taoPrice*sc.mult, value=holdings*price;
        const isCurrent=sc.mult===1.0;
        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;${isCurrent?"background:rgba(255,214,10,0.1);margin:0 -8px;padding:8px;border-radius:4px":""}">
          <span style="font-size:12px;color:${isCurrent?"var(--amber)":"var(--txt2)"};font-weight:${isCurrent?"600":"400"}">${sc.icon} ${sc.name}</span>
          <span style="font-size:11px;color:var(--mute)">$${price.toFixed(2)}/τ</span>
          <span style="font-size:13px;font-weight:700;color:${sc.color}">$${value>=1000000?(value/1000000).toFixed(3)+"M":value.toLocaleString(undefined,{maximumFractionDigits:0})}</span>
        </div>`;
      }).join("");
    };

    const updateStakingChart = (days: number) => {
      currentPeriod=days;
      const holdings=parseFloat((document.getElementById("pa-holdings") as HTMLInputElement)?.value)||1000;
      const dailyRate=17.9/100/365;
      const labels=[], data=[];
      for(let i=0;i<=60;i++){const d=Math.round((i/60)*days);labels.push(i%10===0||i===60?"D"+d:"");data.push(holdings*(Math.pow(1+dailyRate,d)-1));}
      const canvas=document.getElementById("pa-stakingChart") as HTMLCanvasElement;
      if(!canvas) return;
      const Chart=(window as any).Chart;
      if(paStakingChart) paStakingChart.destroy();
      const ctx=canvas.getContext("2d")!;
      const grad=ctx.createLinearGradient(0,0,0,220);
      grad.addColorStop(0,"rgba(59,130,246,0.3)");grad.addColorStop(1,"rgba(59,130,246,0.02)");
      paStakingChart=new Chart(ctx,{
        type:"line",data:{labels,datasets:[{data,borderColor:"#3b82f6",backgroundColor:grad,fill:true,tension:0.4,pointRadius:0,borderWidth:2}]},
        options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:"rgba(255,255,255,0.05)"},ticks:{color:"#606075",font:{size:9}}},y:{grid:{color:"rgba(255,255,255,0.05)"},ticks:{color:"#606075",callback:(v:any)=>v.toFixed(1)+"τ"},beginAtZero:true}}}
      });
    };
    g.updateStakingChart = updateStakingChart;

    // ─── Portfolio Optimizer ──────────────────────────────────────────────────
    const runOptimization = () => {
      const investment=parseFloat((document.getElementById("pro-invest") as HTMLInputElement)?.value)||10000;
      const risk=parseFloat((document.getElementById("pro-risk") as HTMLInputElement)?.value)||3;
      const maxPos=parseFloat((document.getElementById("pro-maxpos") as HTMLInputElement)?.value)||25;
      const objective=document.querySelector("input[name=\"pro-objective\"]:checked") as HTMLInputElement;
      const objVal=objective?.value||"sharpe";
      const taoPrice=currentTaoPrice||191.43;
      let topSubs=[...subs].sort((a,b)=>{
        if(objVal==="maxret") return calcAPY(b)-calcAPY(a);
        if(objVal==="minvol") return calcVolatility(a)-calcVolatility(b);
        return b.score-a.score;
      }).slice(0,8);
      const totalScore=topSubs.reduce((a,s)=>a+s.score,0);
      let weights=topSubs.map(s=>(s.score/totalScore)*100);
      weights=weights.map(w=>Math.min(w,maxPos));
      const tw=weights.reduce((a,w)=>a+w,0);
      weights=weights.map(w=>(w/tw)*100);
      const totalApy=topSubs.reduce((s,sub,i)=>s+(weights[i]/100)*calcAPY(sub),0);
      const weightedVol=30+(risk*5);
      const sharpe=(totalApy-5)/weightedVol;
      const colors=["#3b82f6","#00f0ff","#10b981","#fbbf24","#8b5cf6","#f43f5e","#06b6d4","#f59e0b"];
      const cardsEl=document.getElementById("pro-alloc-cards");
      if(cardsEl){
        cardsEl.innerHTML=topSubs.map((s,i)=>{
          const apy=calcAPY(s), taoAmt=investment*(weights[i]/100);
          return `<div style="background:var(--bg3);border:1px solid var(--bdr);border-radius:8px;padding:12px 16px;min-width:130px">
            <div style="font-size:12px;font-weight:600;margin-bottom:4px">${s.n}</div>
            <div style="font-size:9px;color:var(--mute);margin-bottom:6px">${s.cat}</div>
            <div style="font-size:16px;font-weight:700;color:${colors[i]}">${weights[i].toFixed(1)}%</div>
            <div style="font-size:10px;color:var(--mute)">${taoAmt.toFixed(0)} τ</div>
            <div style="font-size:11px;color:var(--green);font-weight:600;margin-top:4px">${apy.toFixed(1)}% APY</div>
          </div>`;
        }).join("");
      }
      uel("pro-exp-ret",totalApy.toFixed(1)+"%");
      uel("pro-vol",weightedVol.toFixed(1)+"%");
      uel("pro-sharpe",sharpe.toFixed(2));
      uel("pro-sortino-val",(sharpe*1.25).toFixed(2));
      uel("pro-vs-hodl","+"+totalApy.toFixed(1)+"%");
      const usdValue=investment*taoPrice;
      uel("pro-30d","$"+(usdValue*(1+totalApy/100/12)/1000000).toFixed(2)+"M");
      uel("pro-60d","$"+(usdValue*(1+totalApy/100/6)/1000000).toFixed(2)+"M");
      uel("pro-90d","$"+(usdValue*(1+totalApy/100/4)/1000000).toFixed(2)+"M");
      // Frontier chart
      const Chart=(window as any).Chart;
      const fCanvas=document.getElementById("pro-frontier-chart") as HTMLCanvasElement;
      if(fCanvas && Chart){
        if((fCanvas as any).chart) (fCanvas as any).chart.destroy();
        const fp=[];for(let v=15;v<=65;v+=3)fp.push({x:v,y:8+(v-15)*0.5});
        (fCanvas as any).chart=new Chart(fCanvas.getContext("2d"),{
          type:"scatter",
          data:{datasets:[
            {label:"Frontier",data:fp,borderColor:"#00f0ff",backgroundColor:"transparent",showLine:true,tension:0.4,pointRadius:0,borderWidth:2},
            {label:"Portfolio",data:[{x:weightedVol,y:totalApy}],backgroundColor:"#10b981",pointRadius:10},
            {label:"Subnets",data:topSubs.map(s=>({x:calcVolatility(s),y:calcAPY(s)})),backgroundColor:"rgba(245,158,11,0.6)",pointRadius:5}
          ]},
          options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{title:{display:true,text:"Volatility (%)",color:"#606075"},grid:{color:"rgba(255,255,255,0.05)"},ticks:{color:"#606075"},min:10,max:70},y:{title:{display:true,text:"Return (%)",color:"#606075"},grid:{color:"rgba(255,255,255,0.05)"},ticks:{color:"#606075"},min:0,max:45}}}
        });
      }
    };
    g.runOptimization = runOptimization;

    g.selectObjective = (obj: string) => {
      ["sharpe","minvol","maxret","sortino"].forEach(o=>{
        const el=document.getElementById("obj-"+o);
        if(el){el.style.borderColor=o===obj?"var(--cyan)":"var(--bdr)";el.style.background=o===obj?"rgba(0,240,255,0.1)":"var(--bg3)";}
      });
      runOptimization();
    };
    g.updateRiskSlider = () => {
      const val=(document.getElementById("pro-risk") as HTMLInputElement)?.value||"3";
      uel("pro-risk-val",val);
      const pct=((parseInt(val)-1)/4)*100;
      const sl=document.getElementById("pro-risk") as HTMLInputElement;
      if(sl) sl.style.background=`linear-gradient(90deg,var(--cyan) ${pct}%,var(--bg4) ${pct}%)`;
    };

    // ─── TAO Flow ─────────────────────────────────────────────────────────────
    const getMetricColor=(v:number,t:{good:number,neutral:number})=>v>=t.good?"var(--green)":v>=t.neutral?"var(--amber)":"var(--rose)";

    const initTaoFlow = () => {
      const Chart=(window as any).Chart;
      const totalDaily=subs.reduce((s,x)=>s+x.dailyTao,0);
      uel("tf-daily-em",totalDaily.toFixed(0)+" τ");
      // Top yields
      const container=document.getElementById("tf-top-yields");
      if(container){
        const top=[...subs].sort((a,b)=>calcAPY(b)-calcAPY(a)).slice(0,5);
        container.innerHTML=top.map((s,i)=>{
          const apy=calcAPY(s), apyC=getMetricColor(apy,{good:25,neutral:15});
          return `<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--bg4);border-radius:8px">
            <div style="display:flex;align-items:center;gap:10px">
              <div style="width:20px;height:20px;background:var(--bg5);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--mute)">${i+1}</div>
              <div><div style="font-size:12px;font-weight:600">${s.n}</div><div style="font-size:10px;color:var(--mute)">${s.cat}</div></div>
            </div>
            <div style="font-size:14px;font-weight:700;color:${apyC}">${apy.toFixed(1)}%</div>
          </div>`;
        }).join("");
      }
      // Emission flow chart
      const emCanvas=document.getElementById("emissionFlowChart") as HTMLCanvasElement;
      if(emCanvas && Chart){
        const catEm: Record<string,number>={};subs.forEach(s=>{catEm[s.cat]=(catEm[s.cat]||0)+s.dailyTao;});
        const cats=Object.entries(catEm).sort((a,b)=>b[1]-a[1]);
        const colors=["#3b82f6","#06b6d4","#10b981","#f59e0b","#8b5cf6","#f43f5e","#84cc16","#ec4899"];
        new Chart(emCanvas.getContext("2d"),{
          type:"bar",data:{labels:cats.map(([c])=>c),datasets:[{data:cats.map(([,v])=>v),backgroundColor:colors.slice(0,cats.length),borderRadius:4,barThickness:20}]},
          options:{responsive:true,maintainAspectRatio:false,indexAxis:"y",plugins:{legend:{display:false}},scales:{x:{grid:{color:"rgba(255,255,255,0.05)"},ticks:{color:"#606075"}},y:{grid:{display:false},ticks:{color:"#a0a0b8",font:{size:11}}}}}
        });
      }
      // TAO flow table
      const tbody=document.getElementById("tf-table-body");
      if(tbody){
        const sorted=[...subs].sort((a,b)=>calcAPY(b)-calcAPY(a)).slice(0,12);
        tbody.innerHTML=sorted.map(s=>{
          const apy=calcAPY(s), apyC=getMetricColor(apy,{good:25,neutral:15});
          return `<tr style="border-bottom:1px solid var(--bdr)">
            <td style="padding:12px 8px"><div style="font-weight:600">${s.n}</div><div style="font-size:10px;color:var(--mute)">${s.cat}</div></td>
            <td style="padding:12px 8px;text-align:right;font-weight:700;color:${apyC}">${apy.toFixed(1)}%</td>
            <td style="padding:12px 8px;text-align:right">${s.dailyTao.toFixed(0)}τ</td>
            <td style="padding:12px 8px;text-align:right">${(s.share/100*100).toFixed(1)}%</td>
            <td style="padding:12px 8px;text-align:right;color:${s.momentum>=0?"var(--green)":"var(--rose)"}">${s.momentum>=0?"+":""}${s.momentum.toFixed(1)}%</td>
            <td style="padding:12px 8px;text-align:right"><span style="padding:3px 8px;background:rgba(0,240,255,0.15);border-radius:4px;font-size:10px;font-weight:600;color:var(--cyan)">${(calcAPY(s)/calcVolatility(s)).toFixed(2)}</span></td>
          </tr>`;
        }).join("");
      }
    };

    // ─── On-Chain Charts ──────────────────────────────────────────────────────
    const ocLabels = ["Mar 24","Apr 24","May 24","Jun 24","Jul 24","Aug 24","Sep 24","Oct 24","Nov 24","Dec 24","Jan 25","Feb 25","Mar 25","Apr 25","May 25","Jun 25","Jul 25","Aug 25","Sep 25","Oct 25","Nov 25","Dec 25","Jan 26","Feb 26"];
    const ocMvrv = [1.8,5.2,3.1,1.4,0.6,-0.2,0.4,2.1,1.2,1.8,0.9,0.5,0.2,-0.1,1.5,1.2,0.5,0.3,0.0,-0.3,0.2,-0.2,-0.2,-0.38];
    const ocRvt  = [18,12,16,22,28,24,26,19,24,22,20,25,32,38,22,25,30,32,38,42,35,38,36,31.2];
    const ocNupl = [0.42,0.82,0.58,0.32,0.18,-0.05,0.12,0.48,0.35,0.42,0.28,0.18,0.10,0.02,0.38,0.32,0.18,0.12,0.05,-0.08,0.08,-0.02,-0.02,0.09];

    const initOnChainCharts = () => {
      const Chart=(window as any).Chart;
      if(!Chart) return;
      const mkLine=(id:string,data:number[],color:string,fill=true)=>{
        const canvas=document.getElementById(id) as HTMLCanvasElement;
        if(!canvas) return;
        const ctx=canvas.getContext("2d")!;
        const grad=ctx.createLinearGradient(0,0,0,220);
        grad.addColorStop(0,color.replace("rgb","rgba").replace(")",",0.2)"));
        grad.addColorStop(1,color.replace("rgb","rgba").replace(")",",0.02)"));
        new Chart(ctx,{type:"line",data:{labels:ocLabels,datasets:[{data,borderColor:color,borderWidth:2,backgroundColor:fill?grad:"transparent",fill:fill?"origin":false,tension:0.4,pointRadius:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:"rgba(255,255,255,0.05)"},ticks:{color:"#606075",maxTicksLimit:8,maxRotation:45}},y:{grid:{color:"rgba(255,255,255,0.05)"},ticks:{color:"#606075"}}}}});
      };
      mkLine("ocMvrvChart",ocMvrv,"rgb(6,182,212)");
      mkLine("ocRvtChart",ocRvt,"rgb(245,158,11)");
      mkLine("ocNuplChart",ocNupl,"rgb(16,185,129)");
    };

    // ─── Modal helpers ────────────────────────────────────────────────────────
    g.openModal = () => document.getElementById("loginM")?.classList.add("open");
    g.closeModal = () => document.getElementById("loginM")?.classList.remove("open");
    g.handleLogin = (e: Event) => { e.preventDefault(); alert("Magic link sent!"); g.closeModal(); };
    g.openApiSettings = () => document.getElementById("apiModal")?.classList.add("show");
    g.closeApiSettings = () => document.getElementById("apiModal")?.classList.remove("show");
    g.saveAndConnectApi = () => {
      const key=(document.getElementById("taostatsApiKey") as HTMLInputElement)?.value?.trim();
      if(key) localStorage.setItem("taostats_api_key",key);
      g.closeApiSettings();
    };
    g.fetchLiveDataNow = () => { updatePrices(); };

    // ─── Report helpers ───────────────────────────────────────────────────────
    g.exportReportPDF = () => alert("PDF export requires server-side rendering. Download HTML and print to PDF in your browser.");
    g.shareReport = () => alert("Share feature: copy this URL and send it to your recipient.");
    g.regenerateReport = () => alert("Report regenerated with latest data.");

    // ─── Sort menu close on outside click ─────────────────────────────────────
    document.addEventListener("click",(e)=>{
      if(!(e.target as Element)?.closest(".srt")) document.getElementById("srtM")?.classList.remove("open");
    });

    // ─── Sign out button ──────────────────────────────────────────────────────
    const soBtn=document.getElementById("dashboard-signout");
    if(soBtn) soBtn.addEventListener("click",()=>signOut(auth).catch(console.error));

    // ─── Boot sequence ────────────────────────────────────────────────────────
    updateTs();
    updateKPIs();
    updatePrices();
    renderPills();
    renderList();
    renderNews();
    renderTopPerformers();
    initCharts();
    initTicker();
    updateBtcChart(30);
    g.calcFV();
    g.calcDCF();
    g.updateWeights();
    initSubnetSelector();
    updatePortfolioAnalytics();

    // Intervals
    (window as any).__dashboardInterval = setInterval(()=>{ updateTs(); }, 1000);
    setInterval(()=>{ updatePrices(); }, 8000);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} id="deai-dashboard-root">
      <style>{DASHBOARD_CSS}</style>
      <div dangerouslySetInnerHTML={{ __html: DASHBOARD_HTML }} />
    </div>
  );
};

export default DeAIDashboard;

// ─── CSS ──────────────────────────────────────────────────────────────────────
const DASHBOARD_CSS = `
#deai-dashboard-root {
  font-family: 'IBM Plex Mono', monospace;
  background: var(--bg);
  color: var(--txt);
  min-height: 100vh;
  font-size: 13px;
  line-height: 1.5;
}
#deai-dashboard-root {
  --bg:#040508;--bg2:#090c12;--bg3:#0d1117;--bg4:#141b28;--bg5:#1c2638;
  --bdr:#141b28;--bdr2:#1c2638;--txt:#dce8f0;--txt2:#8a9bb0;--mute:#4a5f75;
  --blue:#3b82f6;--cyan:#00f0ff;--green:#00ff99;--amber:#ffd60a;
  --rose:#ff2d55;--violet:#bf5af2;--lime:#84cc16;--pink:#ec4899;--orange:#ff7b2c;
  --grad:linear-gradient(135deg,#00f0ff,#bf5af2);
}
#deai-dashboard-root *{margin:0;padding:0;box-sizing:border-box;}
#deai-dashboard-root ::-webkit-scrollbar{width:6px;height:6px}
#deai-dashboard-root ::-webkit-scrollbar-track{background:var(--bg2)}
#deai-dashboard-root ::-webkit-scrollbar-thumb{background:var(--bdr2);border-radius:3px}
#deai-dashboard-root .subnet-icon{width:40px;height:40px;background:var(--grad);border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;color:#000;flex-shrink:0}
#deai-dashboard-root .grade{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;font-family:'IBM Plex Mono',monospace}
#deai-dashboard-root .grade-a{background:rgba(0,255,153,0.12);color:#00ff99;border:1px solid rgba(0,255,153,0.3)}
#deai-dashboard-root .grade-b{background:rgba(0,240,255,0.12);color:#00f0ff;border:1px solid rgba(0,240,255,0.3)}
#deai-dashboard-root .grade-c{background:rgba(255,214,10,0.12);color:#ffd60a;border:1px solid rgba(255,214,10,0.3)}
#deai-dashboard-root .grade-d{background:rgba(255,45,85,0.12);color:#ff2d55;border:1px solid rgba(255,45,85,0.3)}
#deai-dashboard-root .hdr{background:var(--bg2);border-bottom:1px solid var(--bdr);padding:0 24px;height:64px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100}
#deai-dashboard-root .ticker-container{flex:1;margin:0 24px;overflow:hidden;height:32px;display:flex;align-items:center}
#deai-dashboard-root .ticker{display:flex;gap:20px;animation:deai-scroll 60s linear infinite;white-space:nowrap}
@keyframes deai-scroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
#deai-dashboard-root .ticker-item{display:flex;align-items:center;gap:8px;padding:6px 12px;background:var(--bg3);border:1px solid var(--bdr);border-radius:6px;font-size:11px;flex-shrink:0}
#deai-dashboard-root .ticker-name{font-weight:600;color:var(--txt)}
#deai-dashboard-root .ticker-val{font-family:'IBM Plex Mono',monospace;font-weight:600}
#deai-dashboard-root .logo{display:flex;align-items:center;gap:12px}
#deai-dashboard-root .logo-i{width:40px;height:40px;background:var(--grad);border-radius:10px;display:flex;align-items:center;justify-content:center}
#deai-dashboard-root .logo-t{font-family:'Syne',sans-serif;font-size:18px;font-weight:800;letter-spacing:-0.02em}
#deai-dashboard-root .logo-t span{background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
#deai-dashboard-root .logo-s{font-size:10px;color:var(--mute);letter-spacing:0.1em;text-transform:uppercase}
#deai-dashboard-root .hdr-c{display:flex;gap:16px}
#deai-dashboard-root .stat{display:flex;align-items:center;gap:8px;padding:8px 14px;background:var(--bg3);border:1px solid var(--bdr);border-radius:8px}
#deai-dashboard-root .stat-l{font-size:9px;color:var(--mute);text-transform:uppercase;letter-spacing:0.1em}
#deai-dashboard-root .stat-v{font-size:14px;font-weight:600;font-family:'IBM Plex Mono',monospace;color:var(--cyan)}
#deai-dashboard-root .stat-ch{font-size:11px;font-weight:500}
#deai-dashboard-root .up{color:var(--green)}
#deai-dashboard-root .dn{color:var(--rose)}
#deai-dashboard-root .hdr-r{display:flex;align-items:center;gap:12px}
#deai-dashboard-root .live{display:flex;align-items:center;gap:6px;padding:6px 12px;background:rgba(0,255,153,0.08);border:1px solid rgba(0,255,153,0.25);border-radius:20px;font-size:10px;font-weight:600;color:var(--green);letter-spacing:0.1em;text-transform:uppercase}
#deai-dashboard-root .live-d{width:6px;height:6px;background:var(--green);border-radius:50%;animation:deai-pulse 1.4s ease-in-out infinite}
@keyframes deai-pulse{0%,100%{opacity:1}50%{opacity:0.2}}
#deai-dashboard-root .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 18px;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.2s;font-family:'IBM Plex Mono',monospace;letter-spacing:0.02em}
#deai-dashboard-root .btn-p{background:var(--grad);color:#000;box-shadow:0 2px 12px rgba(0,240,255,0.25)}
#deai-dashboard-root .btn-p:hover{transform:translateY(-1px)}
#deai-dashboard-root .btn-g{background:var(--bg3);border:1px solid var(--bdr);color:var(--txt2)}
#deai-dashboard-root .btn-g:hover{background:var(--bg4);color:var(--txt)}
#deai-dashboard-root .api-modal{position:fixed;inset:0;background:rgba(0,0,0,0.8);backdrop-filter:blur(4px);z-index:1000;display:none;align-items:center;justify-content:center}
#deai-dashboard-root .api-modal.show{display:flex}
#deai-dashboard-root .api-modal-box{background:var(--bg2);border:1px solid var(--bdr);border-radius:16px;padding:28px;width:100%;max-width:480px;box-shadow:0 20px 60px rgba(0,0,0,0.5)}
#deai-dashboard-root .api-modal-hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
#deai-dashboard-root .api-modal-title{font-family:'Syne',sans-serif;font-size:18px;font-weight:700}
#deai-dashboard-root .api-modal-close{width:32px;height:32px;background:var(--bg3);border:1px solid var(--bdr);border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--mute);font-size:18px}
#deai-dashboard-root .api-input-group{margin-bottom:20px}
#deai-dashboard-root .api-input-label{display:block;font-size:11px;color:var(--mute);letter-spacing:0.1em;margin-bottom:8px;text-transform:uppercase}
#deai-dashboard-root .api-input{width:100%;padding:12px 14px;background:var(--bg3);border:1px solid var(--bdr);border-radius:8px;color:var(--txt);font-family:'IBM Plex Mono',monospace;font-size:13px}
#deai-dashboard-root .api-input:focus{outline:none;border-color:var(--cyan)}
#deai-dashboard-root .api-help{font-size:11px;color:var(--mute);line-height:1.6;margin-bottom:20px}
#deai-dashboard-root .api-help a{color:var(--cyan);text-decoration:none}
#deai-dashboard-root .main{display:flex;min-height:calc(100vh - 64px)}
#deai-dashboard-root .side{width:220px;background:var(--bg2);border-right:1px solid var(--bdr);padding:20px 12px;display:flex;flex-direction:column;position:sticky;top:64px;height:calc(100vh - 64px);overflow-y:auto}
#deai-dashboard-root .nav-s{margin-bottom:24px}
#deai-dashboard-root .nav-hd{font-size:9px;font-weight:700;text-transform:uppercase;color:var(--mute);padding:0 12px;margin-bottom:8px;letter-spacing:0.15em}
#deai-dashboard-root .nav-i{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;color:var(--txt2);font-size:13px;font-weight:500;cursor:pointer;transition:all 0.15s;margin-bottom:2px;text-decoration:none;list-style:none}
#deai-dashboard-root .nav-i:hover{background:var(--bg3);color:var(--txt)}
#deai-dashboard-root .nav-i.act{background:var(--bg4);color:var(--txt);box-shadow:inset 3px 0 0 var(--cyan)}
#deai-dashboard-root .nav-icon{width:18px;height:18px;opacity:0.7}
#deai-dashboard-root .nav-i.act .nav-icon{opacity:1}
#deai-dashboard-root .cont{flex:1;padding:28px;overflow-y:auto;position:relative;z-index:1}
#deai-dashboard-root .view{display:none}
#deai-dashboard-root .view.act{display:block}
#deai-dashboard-root .sec{background:var(--bg2);border:1px solid var(--bdr);border-radius:12px;padding:20px;margin-bottom:20px}
#deai-dashboard-root .sec-hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
#deai-dashboard-root .sec-t{font-family:'Syne',sans-serif;font-size:18px;font-weight:700;letter-spacing:-0.02em}
#deai-dashboard-root .sec-sub{font-size:11px;color:var(--mute);margin-top:4px}
#deai-dashboard-root .metric-g{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:20px}
#deai-dashboard-root .metric{background:var(--bg3);border:1px solid var(--bdr);border-radius:10px;padding:16px}
#deai-dashboard-root .metric-hd{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px}
#deai-dashboard-root .metric-l{font-size:11px;color:var(--mute);font-weight:500;letter-spacing:0.1em;text-transform:uppercase}
#deai-dashboard-root .metric-v{font-family:'Syne',sans-serif;font-size:28px;font-weight:800;letter-spacing:-0.02em;margin-bottom:4px}
#deai-dashboard-root .metric-ch{font-size:11px;font-weight:600}
#deai-dashboard-root .grid-2{display:grid;grid-template-columns:repeat(2,1fr);gap:20px}
#deai-dashboard-root .chart-box{background:var(--bg3);border:1px solid var(--bdr);border-radius:10px;padding:16px;height:320px}
#deai-dashboard-root .pill-g{display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap}
#deai-dashboard-root .pill{padding:8px 14px;background:var(--bg3);border:1px solid var(--bdr);border-radius:20px;font-size:11px;font-weight:500;cursor:pointer;transition:all 0.2s}
#deai-dashboard-root .pill:hover,#deai-dashboard-root .pill.act{background:var(--bg4);border-color:var(--bdr2)}
#deai-dashboard-root .pill.act{color:var(--cyan)}
#deai-dashboard-root .time-pills{display:flex;gap:4px}
#deai-dashboard-root .time-pill{padding:6px 12px;background:var(--bg4);border:1px solid var(--bdr);border-radius:6px;font-size:11px;font-weight:600;color:var(--txt2);cursor:pointer;transition:all 0.2s;font-family:inherit}
#deai-dashboard-root .time-pill:hover{background:var(--bg5);color:var(--txt)}
#deai-dashboard-root .time-pill.act{background:var(--cyan);color:#fff;border-color:var(--cyan)}
#deai-dashboard-root .tbl{width:100%;border-collapse:collapse}
#deai-dashboard-root .tbl thead tr{background:var(--bg3);border-bottom:1px solid var(--bdr)}
#deai-dashboard-root .tbl th{padding:12px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;color:var(--mute)}
#deai-dashboard-root .tbl td{padding:14px 12px;border-bottom:1px solid var(--bdr);font-size:13px}
#deai-dashboard-root .tbl tbody tr{cursor:pointer;transition:background 0.15s}
#deai-dashboard-root .tbl tbody tr:hover{background:var(--bg3)}
#deai-dashboard-root .tbl .rank{color:var(--mute);font-family:'IBM Plex Mono',monospace}
#deai-dashboard-root .tbl .n{font-weight:600}
#deai-dashboard-root .tbl .val{font-family:'IBM Plex Mono',monospace}
#deai-dashboard-root .row-exp{background:var(--bg4)!important;border-top:none!important;display:none}
#deai-dashboard-root .row-exp.show{display:table-row}
#deai-dashboard-root .row-exp td{padding:20px 12px!important}
#deai-dashboard-root .exp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:16px}
#deai-dashboard-root .exp-sec{background:var(--bg3);border:1px solid var(--bdr);border-radius:8px;padding:14px}
#deai-dashboard-root .exp-sec-t{font-size:11px;color:var(--cyan);font-weight:700;text-transform:uppercase;margin-bottom:12px}
#deai-dashboard-root .exp-metric{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--bdr)}
#deai-dashboard-root .exp-metric:last-child{margin-bottom:0;padding-bottom:0;border-bottom:none}
#deai-dashboard-root .exp-m-l{font-size:11px;color:var(--mute)}
#deai-dashboard-root .exp-m-v{font-size:13px;font-weight:600;font-family:'IBM Plex Mono',monospace}
#deai-dashboard-root .srt{position:relative}
#deai-dashboard-root .srt-btn{display:flex;align-items:center;gap:6px;padding:8px 12px;background:var(--bg3);border:1px solid var(--bdr);border-radius:8px;font-size:12px;font-weight:500;color:var(--txt2);cursor:pointer}
#deai-dashboard-root .srt-m{position:absolute;top:calc(100% + 4px);right:0;background:var(--bg3);border:1px solid var(--bdr);border-radius:8px;padding:6px;min-width:160px;display:none;z-index:10}
#deai-dashboard-root .srt-m.open{display:block}
#deai-dashboard-root .srt-opt{padding:8px 12px;font-size:12px;color:var(--txt2);cursor:pointer;border-radius:6px;transition:all 0.15s}
#deai-dashboard-root .srt-opt:hover{background:var(--bg4);color:var(--txt)}
#deai-dashboard-root .calc-g{display:grid;grid-template-columns:repeat(2,1fr);gap:20px}
#deai-dashboard-root .calc-box{background:var(--bg3);border:1px solid var(--bdr);border-radius:10px;padding:20px}
#deai-dashboard-root .calc-t{font-size:16px;font-weight:700;margin-bottom:16px}
#deai-dashboard-root .calc-row{margin-bottom:14px}
#deai-dashboard-root .calc-l{font-size:12px;color:var(--mute);margin-bottom:6px;display:flex;justify-content:space-between;align-items:center}
#deai-dashboard-root .calc-weight{font-size:11px;color:var(--cyan);font-family:'IBM Plex Mono',monospace}
#deai-dashboard-root .calc-in{width:100%;padding:10px 12px;background:var(--bg4);border:1px solid var(--bdr);border-radius:8px;color:var(--txt);font-size:13px;font-family:'IBM Plex Mono',monospace}
#deai-dashboard-root .calc-in:focus{outline:none;border-color:var(--cyan)}
#deai-dashboard-root .calc-slider{width:100%;height:6px;border-radius:3px;background:var(--bg4);outline:none;-webkit-appearance:none}
#deai-dashboard-root .calc-slider::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:var(--cyan);cursor:pointer}
#deai-dashboard-root .calc-res{background:var(--bg4);border:1px solid var(--bdr);border-radius:10px;padding:16px;margin-top:16px}
#deai-dashboard-root .calc-res-t{font-size:11px;color:var(--mute);margin-bottom:8px;text-transform:uppercase}
#deai-dashboard-root .calc-res-v{font-size:32px;font-weight:700;font-family:'IBM Plex Mono',monospace;color:var(--cyan)}
#deai-dashboard-root .calc-res-det{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:12px;padding-top:12px;border-top:1px solid var(--bdr)}
#deai-dashboard-root .calc-res-det-i{font-size:11px}
#deai-dashboard-root .calc-res-det-l{color:var(--mute);margin-bottom:2px}
#deai-dashboard-root .calc-res-det-v{font-weight:600;font-family:'IBM Plex Mono',monospace}
#deai-dashboard-root .risk-slider{width:100%;height:8px;-webkit-appearance:none;background:var(--bg4);border-radius:4px;cursor:pointer}
#deai-dashboard-root .risk-slider::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;background:var(--cyan);border-radius:50%;cursor:pointer}
#deai-dashboard-root .obj-option{display:flex;align-items:flex-start;gap:14px;padding:14px 16px;background:var(--bg3);border:2px solid var(--bdr);border-radius:10px;cursor:pointer;margin-bottom:10px;transition:all 0.2s}
#deai-dashboard-root .obj-option:hover,#deai-dashboard-root .obj-option.selected{border-color:var(--cyan);background:rgba(0,240,255,0.05)}
#deai-dashboard-root .obj-option input[type="radio"]{width:18px;height:18px;margin-top:2px;accent-color:var(--cyan)}
#deai-dashboard-root .modal{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:none;align-items:center;justify-content:center;z-index:1000;backdrop-filter:blur(4px)}
#deai-dashboard-root .modal.open{display:flex}
#deai-dashboard-root .modal-box{background:var(--bg2);border:1px solid var(--bdr);border-radius:12px;width:90%;max-width:420px;padding:28px}
#deai-dashboard-root .modal-t{font-size:22px;font-weight:700;margin-bottom:20px}
#deai-dashboard-root .form-row{margin-bottom:16px}
#deai-dashboard-root .form-l{display:block;font-size:12px;color:var(--txt2);margin-bottom:6px}
#deai-dashboard-root .form-in{width:100%;padding:12px;background:var(--bg3);border:1px solid var(--bdr);border-radius:8px;color:var(--txt);font-size:14px}
#deai-dashboard-root .form-in:focus{outline:none;border-color:var(--cyan)}
#deai-dashboard-root .form-act{display:flex;gap:12px;margin-top:24px}
#deai-dashboard-root .form-act .btn{flex:1}
#deai-dashboard-root .price-box{background:var(--bg3);border:1px solid var(--bdr);border-radius:10px;padding:20px;display:flex;align-items:center;gap:16px}
#deai-dashboard-root .price-icon{width:48px;height:48px;background:var(--bg4);border:1px solid var(--bdr);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px}
#deai-dashboard-root .price-info{flex:1}
#deai-dashboard-root .price-l{font-size:10px;color:var(--mute);margin-bottom:4px;text-transform:uppercase;font-weight:600;letter-spacing:0.15em}
#deai-dashboard-root .price-v{font-family:'Syne',sans-serif;font-size:32px;font-weight:800;letter-spacing:-0.02em;color:var(--cyan)}
#deai-dashboard-root .price-ch{font-size:13px;font-weight:600;margin-top:4px}
#deai-dashboard-root .price-stats{display:flex;gap:16px;margin-top:16px;padding:16px;background:var(--bg4);border-radius:8px;flex-wrap:wrap}
#deai-dashboard-root .price-stat{display:flex;flex-direction:column;gap:4px}
#deai-dashboard-root .price-stat-l{font-size:10px;color:var(--mute);text-transform:uppercase;font-weight:600}
#deai-dashboard-root .price-stat-v{font-size:16px;font-weight:700;color:var(--txt)}
#deai-dashboard-root .chart-loading{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:12px;color:var(--mute)}
`;

// ─── HTML ─────────────────────────────────────────────────────────────────────
const DASHBOARD_HTML = `
<header class="hdr">
  <div class="logo">
    <div class="logo-i" style="font-size:24px;font-weight:700;font-family:'IBM Plex Mono',monospace">τ</div>
    <div><div class="logo-t">DeAI <span>Nexus</span></div><div class="logo-s">Bittensor Intelligence</div></div>
  </div>
  <div class="ticker-container"><div class="ticker" id="ticker"></div></div>
  <div class="hdr-c">
    <div class="stat"><div><div class="stat-l">TAO Price</div><div class="stat-v" id="taoP">$191.43</div></div><div class="stat-ch up" id="taoCh">+2.4%</div></div>
    <div class="stat"><div><div class="stat-l">Network Cap</div><div class="stat-v" id="netCap">$1.84B</div></div></div>
    <div class="stat"><div><div class="stat-l">24h Vol</div><div class="stat-v" id="tradeVol">$92.7M</div></div></div>
  </div>
  <div class="hdr-r">
    <div class="live"><div class="live-d"></div><span id="liveTs">LIVE</span></div>
    <button class="btn btn-g" onclick="window.openApiSettings()" style="padding:8px 12px">API</button>
    <button class="btn btn-g" id="dashboard-signout" style="padding:8px 12px">Sign Out</button>
  </div>
</header>

<!-- API Modal -->
<div class="api-modal" id="apiModal">
  <div class="api-modal-box">
    <div class="api-modal-hd"><div class="api-modal-title">API Configuration</div><div class="api-modal-close" onclick="window.closeApiSettings()">×</div></div>
    <div class="api-input-group"><label class="api-input-label">Taostats API Key</label><input type="password" class="api-input" id="taostatsApiKey" placeholder="Enter your Taostats API key"></div>
    <div class="api-help">Get your free API key at <a href="https://taostats.io/api" target="_blank">taostats.io/api</a></div>
    <div style="display:flex;gap:12px"><button class="btn btn-p" onclick="window.saveAndConnectApi()" style="flex:1">Connect & Save</button><button class="btn btn-g" onclick="window.fetchLiveDataNow()">Refresh Now</button></div>
  </div>
</div>

<div class="main">
  <!-- Sidebar -->
  <aside class="side">
    <nav class="nav-s">
      <div class="nav-hd">Analytics</div>
      <a class="nav-i act" data-v="overview" onclick="window.showView('overview')">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        Dashboard
      </a>
      <a class="nav-i" data-v="subnet" onclick="window.showView('subnet')">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="2" x2="12" y2="22"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10"/></svg>
        Subnet Explorer
      </a>
      <a class="nav-i" data-v="valuation" onclick="window.showView('valuation')">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        Valuation Tools
      </a>
      <a class="nav-i" data-v="portfolio" onclick="window.showView('portfolio')">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
        Portfolio Analytics
      </a>
      <a class="nav-i" data-v="taoflow" onclick="window.showView('taoflow')">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M2 12h20"/><circle cx="12" cy="12" r="3"/></svg>
        TAO Flow & Yield
      </a>
    </nav>
    <nav class="nav-s">
      <div class="nav-hd">Institutional</div>
      <a class="nav-i" data-v="portfoliopro" onclick="window.showView('portfoliopro')">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        Portfolio Pro
      </a>
      <a class="nav-i" data-v="onchain" onclick="window.showView('onchain')">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        On-Chain Analytics
      </a>
      <a class="nav-i" data-v="intelligence" onclick="window.showView('intelligence')">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        Intelligence Feed
      </a>
    </nav>
    <div style="margin-top:auto;padding:12px;background:linear-gradient(135deg,rgba(59,130,246,0.1),rgba(139,92,246,0.1));border:1px solid rgba(59,130,246,0.2);border-radius:8px;font-size:11px">
      <div style="font-weight:600;margin-bottom:4px;color:var(--cyan)">Institutional Access</div>
      <div style="color:var(--txt2);margin-bottom:8px">SEC-compliant reporting & audit trails</div>
      <div style="display:flex;gap:4px"><span style="padding:2px 6px;background:var(--bg4);border-radius:3px;font-size:9px;color:var(--green)">SOC 2</span><span style="padding:2px 6px;background:var(--bg4);border-radius:3px;font-size:9px;color:var(--cyan)">API</span></div>
    </div>
  </aside>

  <main class="cont">

    <!-- OVERVIEW VIEW -->
    <div id="overview-view" class="view act">
      <div class="grid-2" style="margin-bottom:20px">
        <div class="price-box"><div class="price-icon">τ</div><div class="price-info"><div class="price-l">TAO Price</div><div class="price-v" id="taoPriceLive">$191.43</div><div class="price-ch up">+2.4% (24h)</div></div></div>
        <div class="price-box"><div class="price-icon">α</div><div class="price-info"><div class="price-l">Top Subnet by MC</div><div class="price-v" style="font-size:20px">Chutes (SN64)</div><div class="price-ch up">$91.8M Market Cap</div></div></div>
      </div>
      <section class="sec">
        <div class="sec-hd"><div><div class="sec-t">Network Overview</div><div class="sec-sub">Real-time Bittensor ecosystem metrics</div></div></div>
        <div class="metric-g">
          <div class="metric"><div class="metric-hd"><div class="metric-l">Total Market Cap</div></div><div class="metric-v" id="kpi-tmc">$847.2M</div><div class="metric-ch up">+5.2% (24h)</div></div>
          <div class="metric"><div class="metric-hd"><div class="metric-l">Active Subnets</div></div><div class="metric-v" id="kpi-sn">15</div><div class="metric-ch up">+3 (7d)</div></div>
          <div class="metric"><div class="metric-hd"><div class="metric-l">Avg P/E Ratio</div></div><div class="metric-v" id="kpi-pe">1.40x</div><div class="metric-ch dn">-0.08x (7d)</div></div>
        </div>
      </section>
      <section class="sec" style="padding:16px 20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div style="font-family:'Syne',sans-serif;font-size:14px;font-weight:700">Top Performers</div>
          <select id="perfSort" onchange="window.renderTopPerformers()" style="padding:6px 10px;background:var(--bg3);border:1px solid var(--bdr);border-radius:6px;color:var(--txt);font-size:11px">
            <option value="momentum">By Momentum</option><option value="apy">By APY</option><option value="sharpe">By Sharpe</option>
          </select>
        </div>
        <div id="topPerfGrid"></div>
      </section>
      <section class="sec">
        <div class="sec-hd">
          <div><div class="sec-t">TAO/BTC Ratio</div><div class="sec-sub">Is TAO gaining against Bitcoin?</div></div>
          <div class="time-pills" id="btcTimePills">
            <button class="time-pill" data-days="1" onclick="window.updateBtcChart(1)">24H</button>
            <button class="time-pill" data-days="7" onclick="window.updateBtcChart(7)">7D</button>
            <button class="time-pill act" data-days="30" onclick="window.updateBtcChart(30)">30D</button>
            <button class="time-pill" data-days="365" onclick="window.updateBtcChart(365)">1Y</button>
            <button class="time-pill" data-days="max" onclick="window.updateBtcChart('max')">ALL</button>
          </div>
        </div>
        <div class="chart-box" style="height:320px;position:relative">
          <div class="chart-loading" id="btcChartLoading"><div style="width:32px;height:32px;border:3px solid var(--bdr);border-top-color:var(--cyan);border-radius:50%;animation:deai-spin 1s linear infinite"></div><span>Loading chart…</span></div>
          <canvas id="taoBtcChart"></canvas>
        </div>
        <div class="price-stats">
          <div class="price-stat"><span class="price-stat-l">Current Ratio</span><span class="price-stat-v" id="taoBtcCurrent" style="color:var(--violet)">Loading…</span></div>
          <div class="price-stat"><span class="price-stat-l">Period Change</span><span class="price-stat-v" id="taoBtcChange">--</span></div>
        </div>
      </section>
      <section class="sec">
        <div class="sec-hd"><div class="sec-t">Valuation Distribution</div></div>
        <div class="chart-box" style="height:360px"><canvas id="valChart"></canvas></div>
      </section>
      <div class="grid-2">
        <section class="sec"><div class="sec-hd"><div class="sec-t">Top Subnets by Market Cap</div></div><div class="chart-box" style="height:360px"><canvas id="mcapChart"></canvas></div></section>
        <section class="sec"><div class="sec-hd"><div class="sec-t">Category Emissions Share</div></div><div class="chart-box" style="height:360px"><canvas id="catChart"></canvas></div></section>
      </div>
    </div>

    <!-- SUBNET EXPLORER VIEW -->
    <div id="subnet-view" class="view">
      <section class="sec">
        <div class="sec-hd">
          <div><div class="sec-t">Subnet Explorer</div><div class="sec-sub">Click any row to expand</div></div>
          <div class="srt">
            <div class="srt-btn" onclick="document.getElementById('srtM').classList.toggle('open')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="6" x2="16" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="16" y2="18"/></svg> Sort by
            </div>
            <div class="srt-m" id="srtM">
              <div class="srt-opt" onclick="window.sortList('mc')">Market Cap</div>
              <div class="srt-opt" onclick="window.sortList('em')">Emissions</div>
              <div class="srt-opt" onclick="window.sortList('pe')">P/E Ratio</div>
              <div class="srt-opt" onclick="window.sortList('score')">Overall Score</div>
              <div class="srt-opt" onclick="window.sortList('apy')">APY</div>
              <div class="srt-opt" onclick="window.sortList('sharpe')">Sharpe</div>
            </div>
          </div>
        </div>
        <div class="pill-g" id="pillG"></div>
        <table class="tbl">
          <thead><tr>
            <th>#</th><th>ID</th><th>Subnet</th><th>Grade</th>
            <th onclick="window.sortList('score')" style="cursor:pointer">Score ↕</th>
            <th onclick="window.sortList('alpha')" style="cursor:pointer">Alpha ↕</th>
            <th onclick="window.sortList('mc')" style="cursor:pointer">Mkt Cap ↕</th>
            <th onclick="window.sortList('em')" style="cursor:pointer">EM % ↕</th>
            <th onclick="window.sortList('apy')" style="cursor:pointer">APY ↕</th>
            <th>A/EM</th><th>Fund</th>
            <th onclick="window.sortList('sharpe')" style="cursor:pointer">Sharpe ↕</th>
          </tr></thead>
          <tbody id="subL"></tbody>
        </table>
      </section>
    </div>

    <!-- VALUATION TOOLS VIEW -->
    <div id="valuation-view" class="view">
      <section class="sec">
        <div class="sec-hd"><div><div class="sec-t">Interactive Valuation Models</div><div class="sec-sub">Professional-grade calculators</div></div></div>
        <div class="calc-g">
          <div class="calc-box">
            <div class="calc-t">⚖️ Fair Value Model</div>
            <div class="calc-row"><label class="calc-l">Annual OpEx ($)<span class="calc-weight">↑ Higher OpEx = Higher FV needed</span></label><input type="number" class="calc-in" id="c-opex" value="9125000" oninput="window.calcFV()"></div>
            <div class="calc-row"><label class="calc-l">Daily Emissions (TAO)</label><input type="number" class="calc-in" id="c-em" value="135" oninput="window.calcFV()"></div>
            <div class="calc-row"><label class="calc-l">Current TAO Price ($)</label><input type="number" class="calc-in" id="c-tp" value="191.43" oninput="window.calcFV()"></div>
            <div class="calc-res"><div class="calc-res-t">Fair Value per TAO</div><div class="calc-res-v" id="fv-r">$185.19</div>
              <div class="calc-res-det">
                <div class="calc-res-det-i"><div class="calc-res-det-l">Signal</div><div class="calc-res-det-v" id="fv-sig">OVER</div></div>
                <div class="calc-res-det-i"><div class="calc-res-det-l">Premium/Discount</div><div class="calc-res-det-v" id="fv-p">-2.4%</div></div>
                <div class="calc-res-det-i"><div class="calc-res-det-l">Daily OpEx</div><div class="calc-res-det-v" id="fv-s">$25,000</div></div>
                <div class="calc-res-det-i"><div class="calc-res-det-l">Annual Emissions Value</div><div class="calc-res-det-v" id="fv-pv">$9.4M</div></div>
              </div>
            </div>
          </div>
          <div class="calc-box">
            <div class="calc-t">📊 DCF Model</div>
            <div class="calc-row"><label class="calc-l">Daily Emissions (TAO)</label><input type="number" class="calc-in" id="d-em" value="135" oninput="window.calcDCF()"></div>
            <div class="calc-row"><label class="calc-l">TAO Price ($)</label><input type="number" class="calc-in" id="d-tao" value="191.43" oninput="window.calcDCF()"></div>
            <div class="calc-row"><label class="calc-l">Annual Growth Rate (%)</label><input type="number" class="calc-in" id="d-g" value="5" oninput="window.calcDCF()"></div>
            <div class="calc-row"><label class="calc-l">Discount Rate (%)</label><input type="number" class="calc-in" id="d-d" value="25" oninput="window.calcDCF()"></div>
            <div class="calc-row"><label class="calc-l">Current Market Cap ($M)</label><input type="number" class="calc-in" id="d-mc" value="35.2" oninput="window.calcDCF()"></div>
            <div class="calc-row"><label class="calc-l">Projection Years</label><input type="number" class="calc-in" id="d-y" value="5" oninput="window.calcDCF()"></div>
            <div class="calc-res"><div class="calc-res-t">DCF Intrinsic Value</div><div class="calc-res-v" id="dcf-r">$42.8M</div>
              <div class="calc-res-det">
                <div class="calc-res-det-i"><div class="calc-res-det-l">Signal</div><div class="calc-res-det-v" id="dcf-sig">UNDER</div></div>
                <div class="calc-res-det-i"><div class="calc-res-det-l">Potential Upside</div><div class="calc-res-det-v" id="dcf-up">+22%</div></div>
                <div class="calc-res-det-i"><div class="calc-res-det-l">Value/Price Ratio</div><div class="calc-res-det-v" id="dcf-rt">1.22x</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section class="sec">
        <div class="sec-hd"><div><div class="sec-t">Score Weight Customization</div><div class="sec-sub">Adjust factor weights for your analysis style</div></div></div>
        <div class="calc-g">
          <div class="calc-box">
            <div class="calc-t">Component Weights</div>
            ${["econ","net","fund","liq","mom","qual","val"].map(k=>`
            <div class="calc-row"><label class="calc-l">${k.charAt(0).toUpperCase()+k.slice(1)}<span class="calc-weight" id="w-${k}">--</span></label>
            <input type="range" class="calc-slider" id="s-${k}" min="0" max="50" value="${{econ:20,net:15,fund:25,liq:15,mom:10,qual:10,val:5}[k as "econ"|"net"|"fund"|"liq"|"mom"|"qual"|"val"]}" oninput="window.updateWeights()"></div>`).join("")}
            <div class="calc-res"><div class="calc-res-t">Total Weight</div><div class="calc-res-v" id="total-weight">100%</div></div>
          </div>
          <div class="calc-box">
            <div class="calc-t">Factor Definitions</div>
            <div style="font-size:12px;line-height:1.8;color:var(--txt2)">
              <div style="margin-bottom:12px;padding:12px;background:var(--bg4);border-radius:8px;border-left:3px solid var(--cyan)"><strong style="color:var(--cyan)">Economic:</strong> Emission share, daily TAO, operational cost coverage.</div>
              <div style="margin-bottom:12px;padding:12px;background:var(--bg4);border-radius:8px;border-left:3px solid var(--green)"><strong style="color:var(--green)">Network:</strong> Active validators, miners, stake, UID utilization.</div>
              <div style="margin-bottom:12px;padding:12px;background:var(--bg4);border-radius:8px;border-left:3px solid var(--violet)"><strong style="color:var(--violet)">Fundamental:</strong> P/E ratio, OpEx replacement value, sustainability.</div>
              <div style="margin-bottom:12px;padding:12px;background:var(--bg4);border-radius:8px;border-left:3px solid var(--amber)"><strong style="color:var(--amber)">Liquidity:</strong> Volume depth, market maker presence, slippage.</div>
              <div style="padding:12px;background:var(--bg4);border-radius:8px;border-left:3px solid var(--pink)"><strong style="color:var(--pink)">Momentum:</strong> 7d/30d price changes, volume trends, stake flows.</div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- PORTFOLIO ANALYTICS VIEW -->
    <div id="portfolio-view" class="view">
      <div style="margin-bottom:32px"><div style="font-family:'Syne',sans-serif;font-size:24px;font-weight:800;margin-bottom:8px">Portfolio Analytics</div><div style="font-size:13px;color:var(--mute)">Personal staking projections and scenario modeling</div></div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:16px;margin-bottom:32px">
        <div style="background:var(--bg2);border:1px solid var(--bdr);border-radius:10px;padding:20px;border-top:3px solid var(--amber)">
          <div style="font-size:10px;color:var(--mute);letter-spacing:0.1em;margin-bottom:10px">YOUR TAO HOLDINGS</div>
          <input type="number" id="pa-holdings" value="10000" oninput="window.updatePortfolioAnalytics()" style="width:100%;background:var(--bg3);border:1px solid var(--bdr);border-radius:6px;padding:10px;font-size:22px;font-weight:700;color:var(--green);font-family:'IBM Plex Mono',monospace">
        </div>
        <div style="background:var(--bg2);border:1px solid var(--bdr);border-radius:10px;padding:20px;border-top:3px solid var(--green)">
          <div style="font-size:10px;color:var(--mute);margin-bottom:10px">USD VALUE</div>
          <div style="font-size:26px;font-weight:700;color:var(--green);font-family:'IBM Plex Mono',monospace" id="pa-usdvalue">$1,914,300</div>
          <div style="font-size:10px;color:var(--mute);margin-top:6px">@ <span id="pa-taoPrice">$191.43</span> / TAO</div>
        </div>
        <div style="background:var(--bg2);border:1px solid var(--bdr);border-radius:10px;padding:20px;border-top:3px solid var(--amber)">
          <div style="font-size:10px;color:var(--mute);margin-bottom:10px">ANNUAL YIELD</div>
          <div style="font-size:26px;font-weight:700;color:var(--amber);font-family:'IBM Plex Mono',monospace"><span id="pa-annualYield">1,477</span> τ</div>
          <div style="font-size:10px;color:var(--mute);margin-top:6px"><span id="pa-avgApy">14.77</span>% network avg</div>
        </div>
        <div style="background:var(--bg2);border:1px solid var(--bdr);border-radius:10px;padding:20px;border-top:3px solid var(--violet)">
          <div style="font-size:10px;color:var(--mute);margin-bottom:10px">MONTHLY INCOME</div>
          <div style="font-size:26px;font-weight:700;color:var(--violet);font-family:'IBM Plex Mono',monospace" id="pa-monthlyUsd">$23,572</div>
        </div>
      </div>
      <section class="sec">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <div style="font-size:13px;font-weight:600">SELECT SUBNETS</div>
          <button class="btn btn-g" onclick="window.selectTopSubnets()" style="padding:6px 12px;font-size:11px">Select Top 8 by APY</button>
        </div>
        <div id="pa-subnetSelector" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px"></div>
      </section>
      <section class="sec">
        <div style="font-size:13px;font-weight:600;margin-bottom:16px">STAKING PROJECTIONS</div>
        <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;min-width:800px">
          <thead><tr style="border-bottom:1px solid var(--bdr)">
            <th style="text-align:left;padding:10px 8px;font-size:9px;color:var(--mute);font-weight:600">SUBNET</th>
            <th style="text-align:right;padding:10px 8px;font-size:9px;color:var(--mute);font-weight:600">APY</th>
            <th style="text-align:right;padding:10px 8px;font-size:9px;color:var(--mute);font-weight:600">DAILY τ</th>
            <th style="text-align:right;padding:10px 8px;font-size:9px;color:var(--mute);font-weight:600">MONTHLY τ</th>
            <th style="text-align:right;padding:10px 8px;font-size:9px;color:var(--mute);font-weight:600">ANNUAL τ</th>
            <th style="text-align:right;padding:10px 8px;font-size:9px;color:var(--mute);font-weight:600">MONTHLY USD</th>
            <th style="text-align:right;padding:10px 8px;font-size:9px;color:var(--mute);font-weight:600">ANNUAL USD</th>
            <th style="text-align:right;padding:10px 8px;font-size:9px;color:var(--mute);font-weight:600">1Y TOTAL</th>
          </tr></thead>
          <tbody id="pa-stakingTable"></tbody>
        </table></div>
      </section>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">
        <section class="sec">
          <div style="font-size:13px;font-weight:600;color:var(--cyan);margin-bottom:16px">Price Scenario Modeler</div>
          <div id="pa-scenarios"></div>
        </section>
        <section class="sec">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <div style="font-size:13px;font-weight:600">Cumulative Staking Rewards</div>
            <div style="display:flex;gap:6px" id="pa-periodPills">
              <button class="time-pill" onclick="window.updateStakingChart(30)">30D</button>
              <button class="time-pill" onclick="window.updateStakingChart(60)">60D</button>
              <button class="time-pill act" onclick="window.updateStakingChart(90)">90D</button>
              <button class="time-pill" onclick="window.updateStakingChart(180)">180D</button>
            </div>
          </div>
          <div style="height:220px"><canvas id="pa-stakingChart"></canvas></div>
        </section>
      </div>
    </div>

    <!-- TAO FLOW VIEW -->
    <div id="taoflow-view" class="view">
      <section class="sec">
        <div class="sec-hd"><div><div class="sec-t">TAO Flow & Yield Analytics</div><div class="sec-sub">Network emission mechanics and staking yields</div></div></div>
        <div class="metric-g">
          <div class="metric"><div class="metric-hd"><div class="metric-l">Daily TAO Emission</div></div><div class="metric-v" id="tf-daily-em" style="color:var(--cyan)">3,600 τ</div></div>
          <div class="metric"><div class="metric-hd"><div class="metric-l">Network Staking APY</div></div><div class="metric-v" id="tf-net-apy" style="color:var(--green)">18.4%</div></div>
          <div class="metric"><div class="metric-hd"><div class="metric-l">Total Value Staked</div></div><div class="metric-v" id="tf-tvs">$892M</div></div>
          <div class="metric"><div class="metric-hd"><div class="metric-l">Emission Yield Ratio</div></div><div class="metric-v" id="tf-eyr" style="color:var(--green)">0.84x</div></div>
        </div>
        <div style="display:grid;grid-template-columns:2fr 1fr;gap:20px;margin-bottom:24px">
          <div style="background:var(--bg3);border:1px solid var(--bdr);border-radius:10px;padding:20px">
            <div style="font-size:14px;font-weight:700;margin-bottom:16px">Emission Distribution by Category</div>
            <div style="height:280px;position:relative"><canvas id="emissionFlowChart"></canvas></div>
          </div>
          <div style="background:var(--bg3);border:1px solid var(--bdr);border-radius:10px;padding:20px">
            <div style="font-size:14px;font-weight:700;margin-bottom:16px">Top Yield Opportunities</div>
            <div id="tf-top-yields" style="display:flex;flex-direction:column;gap:8px"></div>
          </div>
        </div>
        <div style="background:var(--bg3);border:1px solid var(--bdr);border-radius:10px;padding:20px">
          <div style="font-size:14px;font-weight:700;margin-bottom:16px">Subnet Staking Yields</div>
          <table style="width:100%;border-collapse:collapse;font-size:12px">
            <thead><tr style="border-bottom:1px solid var(--bdr)">
              <th style="padding:10px 8px;text-align:left;font-size:10px;color:var(--mute);font-weight:600">SUBNET</th>
              <th style="padding:10px 8px;text-align:right;font-size:10px;color:var(--mute);font-weight:600">STAKING APY</th>
              <th style="padding:10px 8px;text-align:right;font-size:10px;color:var(--mute);font-weight:600">DAILY EMISSION</th>
              <th style="padding:10px 8px;text-align:right;font-size:10px;color:var(--mute);font-weight:600">EMISSION %</th>
              <th style="padding:10px 8px;text-align:right;font-size:10px;color:var(--mute);font-weight:600">7D MOMENTUM</th>
              <th style="padding:10px 8px;text-align:right;font-size:10px;color:var(--mute);font-weight:600">YIELD/RISK</th>
            </tr></thead>
            <tbody id="tf-table-body"></tbody>
          </table>
        </div>
      </section>
    </div>

    <!-- PORTFOLIO PRO VIEW -->
    <div id="portfoliopro-view" class="view">
      <section class="sec">
        <div style="font-size:18px;font-weight:700;margin-bottom:24px">Portfolio Optimizer</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:24px">
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--cyan);margin-bottom:20px">Investment Parameters</div>
            <div style="margin-bottom:20px"><div style="font-size:12px;color:var(--txt2);margin-bottom:8px">Total Investment (TAO)</div><input type="number" class="calc-in" id="pro-invest" value="10000" oninput="window.runOptimization()" style="width:100%;padding:14px;font-size:16px;font-weight:600"></div>
            <div style="margin-bottom:20px"><div style="font-size:12px;color:var(--txt2);margin-bottom:8px">Risk Tolerance (1–5)</div><input type="range" id="pro-risk" min="1" max="5" value="3" class="risk-slider" oninput="window.updateRiskSlider();window.runOptimization()"><div style="font-size:18px;font-weight:700;color:var(--cyan);margin-top:8px" id="pro-risk-val">3</div></div>
            <div style="margin-bottom:20px"><div style="font-size:12px;color:var(--txt2);margin-bottom:8px">Max Single Position (%)</div><input type="number" class="calc-in" id="pro-maxpos" value="25" oninput="window.runOptimization()" style="width:100%"></div>
            <div><div style="font-size:12px;color:var(--txt2);margin-bottom:8px">Min Positions</div><input type="number" class="calc-in" id="pro-minpos" value="5" oninput="window.runOptimization()" style="width:100%"></div>
          </div>
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--cyan);margin-bottom:20px">Optimization Objective</div>
            <label class="obj-option selected" onclick="window.selectObjective('sharpe')" id="obj-sharpe"><input type="radio" name="pro-objective" value="sharpe" checked><div><div style="font-size:14px;font-weight:600">Maximum Sharpe Ratio</div><div style="font-size:12px;color:var(--mute);margin-top:4px">Optimize risk-adjusted returns</div></div></label>
            <label class="obj-option" onclick="window.selectObjective('minvol')" id="obj-minvol"><input type="radio" name="pro-objective" value="minvol"><div><div style="font-size:14px;font-weight:600">Minimum Volatility</div><div style="font-size:12px;color:var(--mute);margin-top:4px">Lowest risk for target return</div></div></label>
            <label class="obj-option" onclick="window.selectObjective('maxret')" id="obj-maxret"><input type="radio" name="pro-objective" value="maxret"><div><div style="font-size:14px;font-weight:600">Maximum Return</div><div style="font-size:12px;color:var(--mute);margin-top:4px">Highest expected return</div></div></label>
          </div>
        </div>
        <button class="btn btn-p" style="width:100%;padding:16px;font-size:14px;font-weight:600" onclick="window.runOptimization()">▶ Run Optimization</button>
      </section>
      <section class="sec">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><div style="font-size:14px;font-weight:600">Optimized Allocation</div></div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px" id="pro-alloc-cards"></div>
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:20px">
          <div style="background:var(--bg3);border:1px solid var(--bdr);border-radius:10px;padding:14px;text-align:center"><div style="font-size:9px;color:var(--mute);margin-bottom:6px">EXPECTED APY</div><div style="font-size:20px;font-weight:700;color:var(--green)" id="pro-exp-ret">--</div></div>
          <div style="background:var(--bg3);border:1px solid var(--bdr);border-radius:10px;padding:14px;text-align:center"><div style="font-size:9px;color:var(--mute);margin-bottom:6px">VOLATILITY</div><div style="font-size:20px;font-weight:700;color:var(--amber)" id="pro-vol">--</div></div>
          <div style="background:var(--bg3);border:1px solid var(--bdr);border-radius:10px;padding:14px;text-align:center"><div style="font-size:9px;color:var(--mute);margin-bottom:6px">SHARPE</div><div style="font-size:20px;font-weight:700;color:var(--cyan)" id="pro-sharpe">--</div></div>
          <div style="background:var(--bg3);border:1px solid var(--bdr);border-radius:10px;padding:14px;text-align:center"><div style="font-size:9px;color:var(--mute);margin-bottom:6px">SORTINO</div><div style="font-size:20px;font-weight:700;color:var(--violet)" id="pro-sortino-val">--</div></div>
          <div style="background:var(--bg3);border:1px solid var(--bdr);border-radius:10px;padding:14px;text-align:center"><div style="font-size:9px;color:var(--mute);margin-bottom:6px">vs HODL</div><div style="font-size:20px;font-weight:700;color:var(--green)" id="pro-vs-hodl">--</div></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
          <div style="background:var(--bg3);border:1px solid var(--bdr);border-radius:10px;padding:16px"><div style="font-size:12px;font-weight:600;margin-bottom:12px">Efficient Frontier</div><div style="height:200px"><canvas id="pro-frontier-chart"></canvas></div></div>
          <div style="background:var(--bg3);border:1px solid var(--bdr);border-radius:10px;padding:16px">
            <div style="font-size:12px;font-weight:600;margin-bottom:12px">90-Day Projections</div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
              <div style="text-align:center;padding:12px;background:var(--bg4);border-radius:8px"><div style="font-size:10px;color:var(--mute)">30 DAY</div><div style="font-size:16px;font-weight:700;color:var(--green)" id="pro-30d">--</div></div>
              <div style="text-align:center;padding:12px;background:var(--bg4);border-radius:8px"><div style="font-size:10px;color:var(--mute)">60 DAY</div><div style="font-size:16px;font-weight:700;color:var(--cyan)" id="pro-60d">--</div></div>
              <div style="text-align:center;padding:12px;background:var(--bg4);border-radius:8px"><div style="font-size:10px;color:var(--mute)">90 DAY</div><div style="font-size:16px;font-weight:700;color:var(--amber)" id="pro-90d">--</div></div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- ON-CHAIN VIEW -->
    <div id="onchain-view" class="view">
      <section class="sec">
        <div class="sec-hd"><div><div class="sec-t">TAO On-Chain Intelligence</div><div class="sec-sub">MVRV Z-Score · RVT Ratio · NUPL · 24-month history</div></div></div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px">
          <div style="background:var(--bg3);border:1px solid var(--bdr);border-radius:10px;padding:20px;border-top:3px solid var(--cyan)">
            <div style="font-size:10px;color:var(--mute);text-transform:uppercase;margin-bottom:8px">MVRV Z-Score</div>
            <div style="font-size:32px;font-weight:800;color:var(--cyan);font-family:'IBM Plex Mono',monospace" id="oc-mvrv">−0.38</div>
            <div style="font-size:11px;color:var(--amber);margin:8px 0">Hope / Recovery Zone</div>
            <div style="font-size:11px;color:var(--txt2)">TAO trades below estimated holder cost basis. Historically a low-risk accumulation region.</div>
          </div>
          <div style="background:var(--bg3);border:1px solid var(--bdr);border-radius:10px;padding:20px;border-top:3px solid var(--amber)">
            <div style="font-size:10px;color:var(--mute);text-transform:uppercase;margin-bottom:8px">RVT Ratio</div>
            <div style="font-size:32px;font-weight:800;color:var(--amber);font-family:'IBM Plex Mono',monospace" id="oc-rvt">31.2</div>
            <div style="font-size:11px;color:var(--amber);margin:8px 0">Moderate — Watch</div>
            <div style="font-size:11px;color:var(--txt2)">Post-halving reduced daily emissions by 50%, compressing new supply pressure.</div>
          </div>
          <div style="background:var(--bg3);border:1px solid var(--bdr);border-radius:10px;padding:20px;border-top:3px solid var(--green)">
            <div style="font-size:10px;color:var(--mute);text-transform:uppercase;margin-bottom:8px">NUPL</div>
            <div style="font-size:32px;font-weight:800;color:var(--green);font-family:'IBM Plex Mono',monospace" id="oc-nupl">0.09</div>
            <div style="font-size:11px;color:var(--amber);margin:8px 0">Hope / Recovery</div>
            <div style="font-size:11px;color:var(--txt2)">Slight aggregate profit. Feb 6 low touched capitulation territory, now recovering.</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
          <div style="background:var(--bg3);border:1px solid var(--bdr);border-radius:10px;padding:20px"><div style="font-size:14px;font-weight:700;margin-bottom:16px">MVRV Z-Score — 24 Month</div><div style="height:220px"><canvas id="ocMvrvChart"></canvas></div></div>
          <div style="background:var(--bg3);border:1px solid var(--bdr);border-radius:10px;padding:20px"><div style="font-size:14px;font-weight:700;margin-bottom:16px">RVT vs TAO Price</div><div style="height:220px"><canvas id="ocRvtChart"></canvas></div></div>
        </div>
        <div style="margin-top:20px;background:var(--bg3);border:1px solid var(--bdr);border-radius:10px;padding:20px"><div style="font-size:14px;font-weight:700;margin-bottom:16px">NUPL — Aggregate Holder Sentiment</div><div style="height:200px"><canvas id="ocNuplChart"></canvas></div></div>
      </section>
    </div>

    <!-- INTELLIGENCE FEED VIEW -->
    <div id="intelligence-view" class="view">
      <section class="sec">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px">
          <div><div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:700;margin-bottom:6px">Live Intelligence Feed</div><div style="font-size:12px;color:var(--mute)">Aggregated from TAO Daily, X/Twitter, CoinTelegraph, TaoStats</div></div>
          <span style="padding:8px 16px;background:rgba(0,255,153,0.1);border:1px solid rgba(0,255,153,0.3);border-radius:20px;font-size:11px;font-weight:600;color:var(--green);display:flex;align-items:center;gap:8px"><span style="width:8px;height:8px;background:var(--green);border-radius:50%;animation:deai-pulse 1.5s infinite"></span>LIVE</span>
        </div>
        <div id="newsG"></div>
      </section>
    </div>

  </main>
</div>

<!-- Login Modal -->
<div id="loginM" class="modal">
  <div class="modal-box">
    <div class="modal-t">Sign in to DeAI Nexus Pro</div>
    <form onsubmit="window.handleLogin(event)">
      <div class="form-row"><label class="form-l">Email Address</label><input type="email" class="form-in" placeholder="your@email.com" required></div>
      <div class="form-act"><button type="button" class="btn btn-g" onclick="window.closeModal()">Cancel</button><button type="submit" class="btn btn-p">Continue</button></div>
    </form>
    <p style="font-size:11px;color:var(--mute);text-align:center;margin-top:20px">We'll send you a magic link to sign in securely</p>
  </div>
</div>

<style>
@keyframes deai-spin{to{transform:rotate(360deg)}}
</style>
`;
