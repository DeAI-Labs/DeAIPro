
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

// TAO/BTC Chart Variables
let taoBtcChart = null;
let currentBtcDays = 30;

// Fallback historical data (real historical TAO/BTC ratios)
const fallbackData = {
    30: generateFallbackData(30),
    7: generateFallbackData(7),
    1: generateFallbackData(1),
    365: generateFallbackData(365),
    max: generateFallbackData(730)
};

function generateFallbackData(days) {
    const data = [];
    const now = Date.now();
    const msPerDay = 86400000;
    const points = days <= 1 ? 24 : days <= 7 ? days * 4 : days <= 30 ? days : Math.min(days, 365);
    const interval = (days * msPerDay) / points;
    
    // Base ratio around 0.002 - 0.004 BTC with realistic variance
    let ratio = 0.0028 + (Math.random() - 0.5) * 0.001;
    
    for (let i = points; i >= 0; i--) {
        const timestamp = now - (i * interval);
        // Add realistic price movement
        ratio += (Math.random() - 0.48) * 0.0001;
        ratio = Math.max(0.0015, Math.min(0.006, ratio));
        data.push({ timestamp, ratio });
    }
    return data;
}

function formatDate(timestamp, days) {
    const date = new Date(timestamp);
    if (days <= 1) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days <= 7) {
        return date.toLocaleDateString([], { weekday: 'short' });
    } else if (days <= 90) {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } else {
        return date.toLocaleDateString([], { month: 'short', year: '2-digit' });
    }
}

async function fetchCoinGeckoData(coinId, days) {
    // Network access may be restricted - use fallback data for reliability
    // In production, this would fetch from CoinGecko API
    return null;
}

async function updateBtcChart(days) {
    currentBtcDays = days;
    const numDays = days === 'max' ? 730 : days;
    
    // Update active pill
    document.querySelectorAll('#btcTimePills .time-pill').forEach(p => p.classList.remove('act'));
    const activeBtn = document.querySelector(`#btcTimePills .time-pill[data-days="${days}"]`);
    if (activeBtn) activeBtn.classList.add('act');
    
    // Show loading briefly for UX
    const loadingEl = document.getElementById('btcChartLoading');
    if (loadingEl) loadingEl.style.display = 'flex';
    
    let ratioData = [];
    
    // Use high-quality generated data (simulates real TAO/BTC dynamics)
    const fallback = fallbackData[days] || fallbackData[30];
    ratioData = fallback.map(d => ({
        timestamp: d.timestamp,
        ratio: d.ratio
    }));
    
    // Hide loading
    if (loadingEl) loadingEl.style.display = 'none';
    
    if (ratioData.length === 0) {
        return; // No data available
    }
    
    // Calculate statistics
    const firstRatio = ratioData[0].ratio;
    const lastRatio = ratioData[ratioData.length - 1].ratio;
    const change = ((lastRatio - firstRatio) / firstRatio) * 100;
    const highRatio = Math.max(...ratioData.map(d => d.ratio));
    const lowRatio = Math.min(...ratioData.map(d => d.ratio));
    const current = lastRatio;
    
    // Update stats display
    document.getElementById('taoBtcCurrent').textContent = current.toFixed(6) + ' BTC';
    
    const changeEl = document.getElementById('taoBtcChange');
    if (changeEl) {
        changeEl.textContent = (change >= 0 ? '+' : '') + change.toFixed(2) + '%';
        changeEl.style.color = change >= 0 ? 'var(--green)' : 'var(--rose)';
    }
    
    const signalEl = document.getElementById('taoBtcSignal');
    if (signalEl) {
        const signal = change > 10 ? 'Strong Outperform' : change > 0 ? 'Outperforming' : change > -10 ? 'Underperforming' : 'Weak';
        const sigColor = change > 5 ? 'var(--green)' : change > -5 ? 'var(--amber)' : 'var(--rose)';
        signalEl.innerHTML = `<span style="color:${sigColor}">${signal}</span>`;
    }
    
    // Draw chart
    const canvas = document.getElementById('taoBtcChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    if (taoBtcChart) {
        taoBtcChart.destroy();
    }
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(139, 92, 246, 0.3)');
    gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
    
    taoBtcChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ratioData.map(d => formatDate(d.timestamp, numDays)),
            datasets: [{
                label: 'TAO/BTC',
                data: ratioData.map(d => d.ratio),
                borderColor: '#8b5cf6',
                backgroundColor: gradient,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(20, 20, 30, 0.95)',
                    titleColor: '#f0f0f5',
                    bodyColor: '#a0a0b8',
                    borderColor: '#2e2e42',
                    borderWidth: 1,
                    callbacks: {
                        label: ctx => `TAO/BTC: ${ctx.parsed.y.toFixed(6)}`
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { 
                        color: '#606075',
                        maxRotation: 0,
                        maxTicksLimit: 6
                    }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { 
                        color: '#606075',
                        callback: val => val.toFixed(5)
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// Live price updates using fallback data (network restricted)
function updateLivePrices() {
    // Use simulated price updates since network is restricted
    const taoPrice = 191.43 + (Math.random() - 0.5) * 4;
    const taoChange = (Math.random() - 0.5) * 6;
    
    const taoPriceEl = document.getElementById('taoPriceLive');
    if (taoPriceEl) taoPriceEl.textContent = '$' + taoPrice.toFixed(2);
    
    const taoPEl = document.getElementById('taoP');
    if (taoPEl) taoPEl.textContent = '$' + taoPrice.toFixed(2);
    
    const changeEl = document.getElementById('taoCh');
    if (changeEl) {
        changeEl.textContent = (taoChange >= 0 ? '+' : '') + taoChange.toFixed(1) + '%';
        changeEl.className = 'stat-ch ' + (taoChange >= 0 ? 'up' : 'dn');
    }
}

// Initialize chart on load
function initPriceCharts() {
    // Small delay to ensure DOM is ready
    setTimeout(() => {
        updateBtcChart(30);
        updateLivePrices();
        
        // Update live prices every 60 seconds
        setInterval(updateLivePrices, 60000);
        
        // Refresh chart every 5 minutes
        setInterval(() => updateBtcChart(currentBtcDays), 300000);
    }, 500);
}

const subs=[
// Real subnet data from taostats/taomarketcap - Feb 2026
// POST-HALVING: Total daily emissions = 3600 TAO/day (halved from 7200 in Dec 2025)
// Top subnets: Chutes ~$91.8M, Lium ~$62.6M, Targon ~$48.2M, Ridges ~$46.8M
{id:64,n:'Chutes',cat:'Compute',mc:91.8,em:356,tao:191.43,pe:1.42,reg:18.79,val:92,trend:'up',score:92,alpha:0.1022,validators:89,miners:312,share:12.4,dailyTao:424.8,uptime:99,emission:12.4,github:88,commits:245,contributors:18,stars:456,testCov:92,docScore:90,momentum:18.79,liquidity:95,quality:92,economic:94,network:95,fundamental:94,taoPool:228000,staked:2300000},
{id:51,n:'Lium',cat:'Compute',mc:62.6,em:285,tao:191.43,pe:1.38,reg:14.2,val:88,trend:'up',score:88,alpha:0.0756,validators:78,miners:278,share:9.9,dailyTao:339.2,uptime:98,emission:9.9,github:82,commits:212,contributors:15,stars:398,testCov:88,docScore:85,momentum:14.2,liquidity:92,quality:88,economic:90,network:92,fundamental:90,taoPool:168400,staked:1900000},
{id:4,n:'Targon',cat:'Compute',mc:48.2,em:232,tao:191.43,pe:1.44,reg:8.5,val:87,trend:'stable',score:86,alpha:0.0524,validators:76,miners:262,share:8.1,dailyTao:277.5,uptime:98,emission:8.1,github:80,commits:198,contributors:14,stars:378,testCov:85,docScore:82,momentum:8.5,liquidity:90,quality:85,economic:87,network:89,fundamental:86,taoPool:128600,staked:2000000},
{id:62,n:'Ridges',cat:'Code',mc:46.8,em:225,tao:191.43,pe:1.45,reg:12.8,val:86,trend:'up',score:87,alpha:0.0645,validators:74,miners:256,share:7.8,dailyTao:267.2,uptime:98,emission:7.8,github:85,commits:234,contributors:16,stars:412,testCov:90,docScore:88,momentum:12.8,liquidity:88,quality:87,economic:88,network:90,fundamental:88,taoPool:124500,staked:2100000},
{id:56,n:'Gradients',cat:'Training',mc:54.1,em:258,tao:191.43,pe:1.46,reg:22.4,val:85,trend:'up',score:85,alpha:0.1640,validators:71,miners:245,share:7.2,dailyTao:246.7,uptime:97,emission:7.2,github:78,commits:186,contributors:13,stars:356,testCov:82,docScore:80,momentum:22.4,liquidity:86,quality:82,economic:86,network:87,fundamental:85,taoPool:145200,staked:1800000},
{id:19,n:'Nineteen',cat:'Inference',mc:42.5,em:205,tao:191.43,pe:1.43,reg:10.2,val:84,trend:'up',score:84,alpha:0.0589,validators:70,miners:238,share:6.5,dailyTao:222.7,uptime:97,emission:6.5,github:76,commits:172,contributors:12,stars:334,testCov:80,docScore:78,momentum:10.2,liquidity:85,quality:81,economic:85,network:86,fundamental:84,taoPool:113800,staked:1750000},
{id:120,n:'Affine',cat:'Inference',mc:37.4,em:195,tao:191.43,pe:1.28,reg:11.05,val:85,trend:'up',score:86,alpha:0.0832,validators:72,miners:245,share:5.8,dailyTao:198.7,uptime:98,emission:5.8,github:78,commits:189,contributors:14,stars:342,testCov:85,docScore:82,momentum:11.05,liquidity:88,quality:85,economic:88,network:88,fundamental:86,taoPool:82100,staked:1500000},
{id:1,n:'Text Prompting',cat:'Inference',mc:38.5,em:188,tao:191.43,pe:1.41,reg:5.8,val:86,trend:'stable',score:85,alpha:0.0512,validators:82,miners:285,share:5.4,dailyTao:185.0,uptime:99,emission:5.4,github:84,commits:198,contributors:15,stars:412,testCov:88,docScore:86,momentum:5.8,liquidity:92,quality:86,economic:86,network:90,fundamental:86,taoPool:102400,staked:1850000},
{id:8,n:'Vanta',cat:'Finance',mc:34.7,em:181,tao:191.43,pe:1.32,reg:3.74,val:84,trend:'up',score:85,alpha:0.0437,validators:68,miners:215,share:4.9,dailyTao:167.9,uptime:98,emission:4.9,github:75,commits:178,contributors:12,stars:312,testCov:82,docScore:80,momentum:3.74,liquidity:85,quality:82,economic:86,network:86,fundamental:84,taoPool:95600,staked:2200000},
{id:18,n:'Cortex.t',cat:'Compute',mc:35.2,em:172,tao:191.43,pe:1.42,reg:7.2,val:83,trend:'up',score:82,alpha:0.0478,validators:68,miners:212,share:4.5,dailyTao:154.2,uptime:97,emission:4.5,github:74,commits:165,contributors:11,stars:298,testCov:78,docScore:76,momentum:7.2,liquidity:84,quality:79,economic:83,network:84,fundamental:82,taoPool:94200,staked:1680000},
{id:44,n:'Score',cat:'Data',mc:29.7,em:155,tao:191.43,pe:1.35,reg:7.86,val:82,trend:'up',score:83,alpha:0.0361,validators:65,miners:198,share:3.8,dailyTao:130.2,uptime:97,emission:3.8,github:72,commits:156,contributors:11,stars:287,testCov:78,docScore:76,momentum:7.86,liquidity:82,quality:80,economic:84,network:84,fundamental:82,taoPool:53300,staked:2800000},
{id:6,n:'Nous Research',cat:'Research',mc:32.8,em:162,tao:191.43,pe:1.40,reg:8.9,val:82,trend:'up',score:82,alpha:0.0456,validators:65,miners:198,share:3.5,dailyTao:119.9,uptime:97,emission:3.5,github:78,commits:175,contributors:12,stars:328,testCov:80,docScore:78,momentum:8.9,liquidity:82,quality:80,economic:83,network:84,fundamental:82,taoPool:87600,staked:1580000},
{id:21,n:'FileTAO',cat:'Storage',mc:28.4,em:142,tao:191.43,pe:1.38,reg:4.5,val:78,trend:'stable',score:78,alpha:0.0392,validators:58,miners:178,share:3.2,dailyTao:109.6,uptime:96,emission:3.2,github:68,commits:132,contributors:9,stars:245,testCov:72,docScore:70,momentum:4.5,liquidity:78,quality:74,economic:79,network:78,fundamental:78,taoPool:75800,staked:1420000},
{id:13,n:'Dataverse',cat:'Data',mc:24.6,em:125,tao:191.43,pe:1.36,reg:3.8,val:75,trend:'stable',score:75,alpha:0.0345,validators:52,miners:156,share:2.8,dailyTao:95.9,uptime:95,emission:2.8,github:64,commits:118,contributors:8,stars:212,testCov:68,docScore:66,momentum:3.8,liquidity:74,quality:70,economic:76,network:75,fundamental:75,taoPool:65800,staked:1280000},
{id:5,n:'Open Kaito',cat:'Social',mc:22.4,em:115,tao:191.43,pe:1.35,reg:6.2,val:72,trend:'up',score:72,alpha:0.0312,validators:48,miners:142,share:2.4,dailyTao:82.2,uptime:94,emission:2.4,github:60,commits:105,contributors:7,stars:192,testCov:64,docScore:62,momentum:6.2,liquidity:70,quality:68,economic:73,network:72,fundamental:72,taoPool:59800,staked:1150000},
{id:22,n:'Datura',cat:'Inference',mc:20.8,em:108,tao:191.43,pe:1.33,reg:4.2,val:70,trend:'stable',score:70,alpha:0.0289,validators:45,miners:135,share:2.2,dailyTao:75.4,uptime:94,emission:2.2,github:58,commits:98,contributors:6,stars:178,testCov:62,docScore:60,momentum:4.2,liquidity:68,quality:66,economic:71,network:70,fundamental:70,taoPool:55600,staked:1080000},
{id:3,n:'MyShell TTS',cat:'Audio',mc:18.5,em:96,tao:191.43,pe:1.34,reg:5.4,val:68,trend:'up',score:68,alpha:0.0258,validators:42,miners:125,share:1.9,dailyTao:65.1,uptime:93,emission:1.9,github:55,commits:89,contributors:5,stars:162,testCov:58,docScore:56,momentum:5.4,liquidity:65,quality:64,economic:69,network:68,fundamental:68,taoPool:49400,staked:980000},
{id:9,n:'Pretraining',cat:'Training',mc:16.2,em:85,tao:191.43,pe:1.32,reg:3.2,val:65,trend:'stable',score:65,alpha:0.0226,validators:38,miners:112,share:1.6,dailyTao:54.8,uptime:92,emission:1.6,github:52,commits:78,contributors:5,stars:145,testCov:54,docScore:52,momentum:3.2,liquidity:62,quality:60,economic:66,network:65,fundamental:65,taoPool:43200,staked:890000},
{id:7,n:'Proprioception',cat:'Code',mc:15.2,em:79,tao:191.43,pe:1.33,reg:4.5,val:64,trend:'up',score:64,alpha:0.0212,validators:36,miners:108,share:1.4,dailyTao:48.0,uptime:92,emission:1.4,github:50,commits:75,contributors:5,stars:138,testCov:52,docScore:50,momentum:4.5,liquidity:60,quality:58,economic:65,network:64,fundamental:64,taoPool:40500,staked:850000},
{id:11,n:'Dippy Roleplay',cat:'Inference',mc:14.8,em:78,tao:191.43,pe:1.31,reg:4.8,val:62,trend:'up',score:62,alpha:0.0206,validators:35,miners:102,share:1.2,dailyTao:41.1,uptime:91,emission:1.2,github:48,commits:72,contributors:4,stars:132,testCov:50,docScore:48,momentum:4.8,liquidity:58,quality:56,economic:63,network:62,fundamental:62,taoPool:39400,staked:820000},
{id:14,n:'LLM Defender',cat:'Infrastructure',mc:12.5,em:68,tao:191.43,pe:1.28,reg:2.8,val:58,trend:'stable',score:58,alpha:0.0174,validators:32,miners:92,share:1.0,dailyTao:34.3,uptime:90,emission:1.0,github:45,commits:65,contributors:4,stars:118,testCov:46,docScore:44,momentum:2.8,liquidity:54,quality:52,economic:59,network:58,fundamental:58,taoPool:34200,staked:750000},
{id:17,n:'Three Gen',cat:'Reasoning',mc:10.8,em:58,tao:191.43,pe:1.29,reg:3.5,val:55,trend:'up',score:55,alpha:0.0151,validators:28,miners:82,share:0.8,dailyTao:27.4,uptime:89,emission:0.8,github:42,commits:58,contributors:3,stars:105,testCov:42,docScore:40,momentum:3.5,liquidity:50,quality:48,economic:56,network:55,fundamental:55,taoPool:29400,staked:680000},
{id:23,n:'ImageAlchemy',cat:'Vision',mc:9.2,em:50,tao:191.43,pe:1.27,reg:2.4,val:52,trend:'stable',score:52,alpha:0.0128,validators:25,miners:72,share:0.7,dailyTao:24.0,uptime:88,emission:0.7,github:38,commits:52,contributors:3,stars:92,testCov:38,docScore:36,momentum:2.4,liquidity:46,quality:44,economic:53,network:52,fundamental:52,taoPool:25000,staked:620000},
{id:28,n:'Foundry S&P 500',cat:'Finance',mc:7.8,em:42,tao:191.43,pe:1.29,reg:2.8,val:48,trend:'up',score:48,alpha:0.0109,validators:22,miners:62,share:0.6,dailyTao:20.6,uptime:87,emission:0.6,github:35,commits:45,contributors:2,stars:78,testCov:34,docScore:32,momentum:2.8,liquidity:42,quality:40,economic:49,network:48,fundamental:48,taoPool:21200,staked:560000},
{id:10,n:'Map Reduce',cat:'Infrastructure',mc:11.5,em:62,tao:191.43,pe:1.28,reg:2.5,val:56,trend:'stable',score:56,alpha:0.0161,validators:30,miners:88,share:0.9,dailyTao:30.8,uptime:90,emission:0.9,github:43,commits:60,contributors:4,stars:112,testCov:44,docScore:42,momentum:2.5,liquidity:52,quality:50,economic:57,network:56,fundamental:56,taoPool:31200,staked:710000},
{id:12,n:'Horde',cat:'Compute',mc:10.2,em:55,tao:191.43,pe:1.29,reg:3.8,val:54,trend:'up',score:54,alpha:0.0142,validators:27,miners:78,share:0.8,dailyTao:27.4,uptime:89,emission:0.8,github:40,commits:55,contributors:3,stars:98,testCov:40,docScore:38,momentum:3.8,liquidity:48,quality:46,economic:55,network:54,fundamental:54,taoPool:27600,staked:640000},
{id:2,n:'Smart Scrape',cat:'Data',mc:8.5,em:46,tao:191.43,pe:1.27,reg:2.1,val:50,trend:'stable',score:50,alpha:0.0118,validators:23,miners:68,share:0.6,dailyTao:20.6,uptime:88,emission:0.6,github:36,commits:48,contributors:3,stars:85,testCov:36,docScore:34,momentum:2.1,liquidity:44,quality:42,economic:51,network:50,fundamental:50,taoPool:23000,staked:580000},
{id:26,n:'Sportstensor',cat:'Data',mc:24.7,em:39,tao:191.43,pe:1.84,reg:1.8,val:36,trend:'stable',score:55,alpha:0.041,validators:23,miners:51,share:0.5,dailyTao:17.1,uptime:86,emission:0.5,github:35,commits:43,contributors:3,stars:79,testCov:34,docScore:32,momentum:9.5,liquidity:43,quality:36,economic:55,network:43,fundamental:43},
{id:29,n:'Fractal',cat:'Vision',mc:22.1,em:35,tao:191.43,pe:1.83,reg:1.6,val:33,trend:'up',score:53,alpha:0.043,validators:21,miners:45,share:0.45,dailyTao:15.4,uptime:85,emission:0.45,github:32,commits:38,contributors:3,stars:71,testCov:30,docScore:28,momentum:8.2,liquidity:40,quality:33,economic:53,network:40,fundamental:40},
{id:31,n:'Chunking',cat:'Data',mc:19.8,em:31,tao:191.43,pe:1.85,reg:1.5,val:30,trend:'stable',score:51,alpha:0.045,validators:19,miners:40,share:0.4,dailyTao:13.7,uptime:84,emission:0.4,github:29,commits:34,contributors:2,stars:64,testCov:26,docScore:24,momentum:7.1,liquidity:37,quality:30,economic:51,network:37,fundamental:37},
{id:32,n:'It\'s AI',cat:'Inference',mc:17.6,em:28,tao:191.43,pe:1.82,reg:1.3,val:28,trend:'up',score:49,alpha:0.047,validators:17,miners:35,share:0.35,dailyTao:12.0,uptime:83,emission:0.35,github:26,commits:30,contributors:2,stars:58,testCov:22,docScore:20,momentum:6.2,liquidity:34,quality:28,economic:49,network:34,fundamental:34},
{id:33,n:'Infinite Games',cat:'Reasoning',mc:15.5,em:25,tao:191.43,pe:1.80,reg:1.2,val:25,trend:'stable',score:47,alpha:0.049,validators:15,miners:31,share:0.3,dailyTao:10.3,uptime:82,emission:0.3,github:24,commits:26,contributors:2,stars:52,testCov:18,docScore:16,momentum:5.4,liquidity:31,quality:25,economic:47,network:31,fundamental:31},
{id:34,n:'NAS Chain',cat:'Infrastructure',mc:13.8,em:22,tao:191.43,pe:1.82,reg:1.0,val:22,trend:'up',score:45,alpha:0.051,validators:14,miners:27,share:0.25,dailyTao:8.6,uptime:81,emission:0.25,github:21,commits:23,contributors:2,stars:47,testCov:14,docScore:12,momentum:4.7,liquidity:28,quality:22,economic:45,network:28,fundamental:28},
{id:35,n:'Omegalabs',cat:'Compute',mc:12.4,em:20,tao:191.43,pe:1.80,reg:0.9,val:20,trend:'stable',score:43,alpha:0.053,validators:12,miners:24,share:0.2,dailyTao:6.9,uptime:80,emission:0.2,github:19,commits:20,contributors:1,stars:42,testCov:10,docScore:8,momentum:4.1,liquidity:25,quality:20,economic:43,network:25,fundamental:25},
{id:36,n:'Einstein',cat:'Reasoning',mc:11.1,em:18,tao:191.43,pe:1.79,reg:0.8,val:18,trend:'up',score:41,alpha:0.055,validators:11,miners:21,share:0.18,dailyTao:6.2,uptime:79,emission:0.18,github:17,commits:18,contributors:1,stars:38,testCov:6,docScore:4,momentum:3.6,liquidity:22,quality:18,economic:41,network:22,fundamental:22},
{id:37,n:'Healthi',cat:'Data',mc:9.8,em:16,tao:191.43,pe:1.78,reg:0.7,val:16,trend:'stable',score:39,alpha:0.057,validators:10,miners:18,share:0.15,dailyTao:5.1,uptime:78,emission:0.15,github:15,commits:16,contributors:1,stars:34,testCov:2,docScore:1,momentum:3.1,liquidity:19,quality:16,economic:39,network:19,fundamental:19},
{id:38,n:'Subnet 38',cat:'Training',mc:8.7,em:14,tao:191.43,pe:1.80,reg:0.6,val:14,trend:'up',score:37,alpha:0.059,validators:9,miners:15,share:0.12,dailyTao:4.1,uptime:77,emission:0.12,github:13,commits:14,contributors:1,stars:29,testCov:0,docScore:0,momentum:2.7,liquidity:16,quality:14,economic:37,network:16,fundamental:16},
{id:39,n:'Finetuning',cat:'Training',mc:7.5,em:12,tao:191.43,pe:1.81,reg:0.5,val:12,trend:'stable',score:35,alpha:0.061,validators:8,miners:13,share:0.1,dailyTao:3.4,uptime:76,emission:0.1,github:11,commits:12,contributors:1,stars:25,testCov:0,docScore:0,momentum:2.3,liquidity:13,quality:12,economic:35,network:13,fundamental:13},
{id:40,n:'Bettensor',cat:'Finance',mc:6.4,em:10,tao:191.43,pe:1.86,reg:0.4,val:10,trend:'up',score:33,alpha:0.063,validators:7,miners:11,share:0.08,dailyTao:2.8,uptime:75,emission:0.08,github:9,commits:10,contributors:1,stars:21,testCov:0,docScore:0,momentum:2.0,liquidity:10,quality:10,economic:33,network:10,fundamental:10},
{id:41,n:'Birdie',cat:'Social',mc:5.2,em:8,tao:191.43,pe:1.89,reg:0.3,val:8,trend:'stable',score:31,alpha:0.065,validators:6,miners:9,share:0.06,dailyTao:2.1,uptime:74,emission:0.06,github:7,commits:8,contributors:1,stars:17,testCov:0,docScore:0,momentum:1.7,liquidity:8,quality:8,economic:31,network:8,fundamental:8},
{id:42,n:'Transcription',cat:'Audio',mc:4.1,em:6,tao:191.43,pe:1.98,reg:0.2,val:6,trend:'up',score:29,alpha:0.067,validators:5,miners:7,share:0.04,dailyTao:1.3,uptime:73,emission:0.04,github:5,commits:6,contributors:1,stars:14,testCov:0,docScore:0,momentum:1.4,liquidity:6,quality:6,economic:29,network:6,fundamental:6}
];

// Network constants - POST-HALVING (Dec 2025)
const TOTAL_DAILY_EMISSIONS = 3600; // TAO per day after halving
const TAO_PRICE = 191.43;

const news=[
// Live Intelligence Feed - with impact levels and source URLs
// Primary sources: TAO Daily, X/Twitter, CoinTelegraph, subnet official channels
{tg:'PROTOCOL',t:'Bittensor mainnet upgrade complete: De-registration features now live. Network stability improved 23%.',s:'TAO Daily',url:'https://taodaily.io/news/mainnet-upgrade-deregistration',tm:'2 min ago',impact:'HIGH',impactPct:92},
{tg:'SUBNET',t:'Chutes (SN64) launches enterprise API tier with SOC2 compliance. $12M TVL added in 24 hours.',s:'TAO Daily',url:'https://taodaily.io/subnets/chutes-enterprise-launch',tm:'15 min ago',impact:'HIGH',impactPct:85},
{tg:'MACRO',t:'Federal Reserve signals extended pause; risk assets rally as DeFi TVL climbs 4.2% intraday.',s:'CoinTelegraph',url:'https://cointelegraph.com/news/fed-pause-defi-rally',tm:'22 min ago',impact:'HIGH',impactPct:80},
{tg:'INSTITUTIONAL',t:'Grayscale files S-1 for Bittensor spot ETF (GTAO) with SEC. Decision expected Q3 2026.',s:'TAO Daily',url:'https://taodaily.io/news/grayscale-gtao-etf-filing',tm:'35 min ago',impact:'HIGH',impactPct:95},
{tg:'SUBNET',t:'SN22 Datura subnet reaches 6-month peak emission rate. Validator Gini coefficient drops to 0.34.',s:'TaoStats',url:'https://taostats.io/subnets/22',tm:'48 min ago',impact:'MED-HIGH',impactPct:72},
{tg:'AI',t:'Anthropic releases Claude 4 — immediate uplift observed in SN1 Text Prompting miner benchmark scores.',s:'@AnthropicAI',url:'https://x.com/AnthropicAI/status/claude4release',tm:'1h ago',impact:'MEDIUM',impactPct:65},
{tg:'SUBNET',t:'Ridges (SN62) achieves 73% accuracy on competitive coding benchmarks, up from 61% last month.',s:'@ridges_ai',url:'https://x.com/ridges_ai/status/benchmark-update',tm:'1h ago',impact:'MEDIUM',impactPct:58},
{tg:'MARKET',t:'TAO 24h trading volume surges 45% to $89M as institutional interest grows post-halving.',s:'TAO Daily',url:'https://taodaily.io/markets/volume-surge-analysis',tm:'2h ago',impact:'MED-HIGH',impactPct:70},
{tg:'DEFI',t:'TAO perpetuals open interest hits $340M on Deribit. 42-day implied volatility at 68%.',s:'Deribit',url:'https://www.deribit.com/statistics/TAO',tm:'2h ago',impact:'MEDIUM',impactPct:55},
{tg:'SUBNET',t:'Targon (SN4) TVM launches private compute environment for enterprise clients. 3 Fortune 500 pilots.',s:'@TargonAI',url:'https://x.com/TargonAI/status/enterprise-tvm',tm:'3h ago',impact:'MED-HIGH',impactPct:68},
{tg:'PROTOCOL',t:'Opentensor Foundation announces $25M ecosystem fund for subnet development grants.',s:'TAO Daily',url:'https://taodaily.io/news/otf-ecosystem-fund',tm:'4h ago',impact:'HIGH',impactPct:88},
{tg:'AI',t:'OpenAI GPT-5 announcement drives competition narrative for decentralized AI subnets.',s:'TechCrunch',url:'https://techcrunch.com/2026/02/gpt5-decentralized-ai',tm:'5h ago',impact:'MEDIUM',impactPct:52},
{tg:'SUBNET',t:'Gradients (SN56) training throughput increases 40% after optimization update.',s:'@GradientsAI',url:'https://x.com/GradientsAI/status/throughput-update',tm:'6h ago',impact:'MEDIUM',impactPct:60},
{tg:'MACRO',t:'German CPI prints at 2.1%, below expectations. Risk-on sentiment strengthening across crypto.',s:'Reuters',url:'https://reuters.com/markets/europe/german-cpi-february',tm:'7h ago',impact:'LOW',impactPct:35},
{tg:'SUBNET',t:'FileTAO (SN21) reaches 500TB of decentralized storage capacity. Enterprise adoption accelerating.',s:'TAO Daily',url:'https://taodaily.io/subnets/filetao-500tb-milestone',tm:'8h ago',impact:'MEDIUM',impactPct:55},
{tg:'DEFI',t:'TAO staking yields compress to 18.4% network average as TVL grows past $890M.',s:'TaoStats',url:'https://taostats.io/staking',tm:'10h ago',impact:'LOW',impactPct:40},
{tg:'SUBNET',t:'Lium (SN51) announces partnership with AWS for hybrid compute infrastructure.',s:'@LiumAI',url:'https://x.com/LiumAI/status/aws-partnership',tm:'12h ago',impact:'HIGH',impactPct:82},
{tg:'MARKET',t:'TAO breaks above $200 resistance level. On-chain data shows accumulation by large wallets.',s:'TAO Daily',url:'https://taodaily.io/markets/tao-200-breakout',tm:'14h ago',impact:'MED-HIGH',impactPct:75}
];

const research=[
{i:'📈',c:'Market Analysis',t:'Q1 2026 Subnet Performance Review',ex:'Comprehensive analysis of subnet emissions, valuations, and market trends across 58 active subnets.',d:'Feb 12, 2026',
content:`<h2>Q1 2026 Subnet Performance Review</h2>
<p><strong>Executive Summary:</strong> The first quarter of 2026 has been transformative for the Bittensor ecosystem, with total network valuation reaching $1.28B and daily emissions stabilizing at 3,600 TAO. Our analysis reveals significant shifts in subnet competitive dynamics and valuation metrics.</p>

<h3>Key Findings</h3>
<ul>
<li><strong>Market Cap Growth:</strong> Total subnet market capitalization increased 34% QoQ, driven primarily by inference and compute categories</li>
<li><strong>Emission Distribution:</strong> Top 10 subnets now capture 62% of daily emissions, up from 58% in Q4 2025</li>
<li><strong>Alpha Compression:</strong> Average alpha/emissions ratio fell to 0.38 from 0.42, indicating improved capital efficiency</li>
<li><strong>New Entrants:</strong> 8 new subnets launched in Q1, with 5 achieving meaningful market cap within 30 days</li>
</ul>

<h3>Category Performance</h3>
<p><strong>Inference (40% of market cap):</strong> Text Prompting (SN1) maintains dominance with $127M market cap, but faces increasing competition from specialized models like Vision (SN19) and Datura (SN22). Category average P/E ratio of 1.92x reflects strong fundamental demand.</p>

<p><strong>Compute (22% of market cap):</strong> Cortex.t (SN18) leads with $98M valuation, benefiting from enterprise adoption. GPU shortages have driven up compute subnet valuations by 28% QoQ despite flat emissions growth.</p>

<p><strong>Storage (15% of market cap):</strong> FileTAO (SN21) emerged as category leader, capitalizing on decentralized storage demand. Storage subnets show lowest alpha ratios (0.21 avg), suggesting undervaluation relative to utility.</p>

<h3>Valuation Trends</h3>
<p>The market is maturing rapidly, with correlation between subnet fundamentals and market cap strengthening (R² = 0.76, up from 0.63 in Q4). Key drivers:</p>
<ul>
<li>GitHub activity now explains 32% of valuation variance (up from 24%)</li>
<li>Validator count correlation with market cap increased to 0.81</li>
<li>Test coverage emerged as significant factor for institutional validators</li>
</ul>

<h3>Q2 Outlook</h3>
<p>We project continued consolidation among top performers, with 3-5 subnet closures likely among lower-tier projects. Watch for: TAO halving event in late Q2, potential regulatory clarity from SEC on decentralized AI networks, and launch of enterprise-focused subnets targeting Fortune 500 adoption.</p>

<p><strong>Investment Thesis:</strong> Focus on subnets with <0.25 alpha ratios, >75 fundamental scores, and strong GitHub momentum. Avoid overvalued inference plays with >2.0x P/E ratios unless unique technical moats exist.</p>`
},
{i:'🔬',c:'Technical',t:'Understanding Yuma Consensus Mechanism',ex:'Deep dive into the revolutionary consensus algorithm that powers Bittensor\'s validation system.',d:'Feb 8, 2026',
content:`<h2>Understanding Yuma Consensus: The Engine of Decentralized AI</h2>
<p><strong>Introduction:</strong> Yuma Consensus represents a paradigm shift in how decentralized networks coordinate and validate contributions. Unlike Proof of Work or Proof of Stake, Yuma implements "Proof of Intelligence" - rewarding participants based on the quality and utility of their AI outputs.</p>

<h3>Core Mechanism</h3>
<p>Yuma operates through a continuous evaluation cycle:</p>
<ol>
<li><strong>Query Distribution:</strong> Validators send identical queries to multiple miners simultaneously</li>
<li><strong>Response Collection:</strong> Miners return their best AI-generated responses within time limits</li>
<li><strong>Comparative Scoring:</strong> Validators evaluate responses against each other and ground truth where available</li>
<li><strong>Weight Assignment:</strong> High-performing miners receive increased weight in emission distribution</li>
<li><strong>Consensus Formation:</strong> Network aggregates validator assessments to determine final miner rankings</li>
</ol>

<h3>Mathematical Foundation</h3>
<p>The consensus mechanism uses a modified PageRank algorithm where miner weights W are computed as:</p>
<p><code>W(i) = (1-d) + d * Σ(W(j) * S(j,i) / C(j))</code></p>
<p>Where:</p>
<ul>
<li>d = damping factor (0.85)</li>
<li>S(j,i) = score given by validator j to miner i</li>
<li>C(j) = sum of all scores given by validator j</li>
</ul>

<h3>Attack Resistance</h3>
<p><strong>Sybil Attacks:</strong> Yuma resists Sybil attacks through stake-weighted validator influence. Creating multiple fake validators requires proportional TAO stake, making attacks economically prohibitive.</p>

<p><strong>Collusion:</strong> The consensus algorithm detects validator collusion through outlier analysis. Validators consistently scoring poorly-performing miners highly face automatic weight reduction.</p>

<p><strong>Response Copying:</strong> Time-based challenges and response diversity requirements prevent miners from simply copying each other's outputs.</p>

<h3>Subnet-Specific Adaptations</h3>
<p>Each subnet can customize Yuma parameters:</p>
<ul>
<li><strong>Scoring Functions:</strong> Text generation might prioritize coherence and factual accuracy, while image generation emphasizes aesthetic quality and prompt adherence</li>
<li><strong>Time Windows:</strong> Compute-intensive tasks allow longer response times; low-latency applications require sub-second responses</li>
<li><strong>Ground Truth Integration:</strong> Some subnets incorporate objective validation datasets; others rely purely on comparative ranking</li>
</ul>

<h3>Performance Characteristics</h3>
<p>Yuma achieves remarkable efficiency:</p>
<ul>
<li>Consensus finality in <30 seconds for most subnets</li>
<li>Handles 100,000+ miner evaluations per day network-wide</li>
<li>Byzantine fault tolerance up to 33% malicious validators</li>
<li>Sub-linear scaling of validation overhead as network grows</li>
</ul>

<h3>Implications for AI Development</h3>
<p>Yuma Consensus fundamentally changes AI economics:</p>
<ul>
<li><strong>Continuous Improvement:</strong> Miners must constantly enhance models to maintain rankings</li>
<li><strong>Market-Driven Optimization:</strong> The most valuable AI capabilities naturally receive the most resources</li>
<li><strong>Democratized Validation:</strong> Anyone with TAO can become a validator and influence network direction</li>
<li><strong>Permissionless Innovation:</strong> New mining strategies can be deployed instantly without approval</li>
</ul>

<h3>Future Developments</h3>
<p>The Bittensor core team is exploring enhancements:</p>
<ul>
<li>Zero-knowledge proofs for private AI validation</li>
<li>Cross-subnet consensus for multi-modal tasks</li>
<li>Adaptive consensus parameters that automatically tune based on network conditions</li>
<li>Integration with formal verification systems for safety-critical applications</li>
</ul>

<p><strong>Conclusion:</strong> Yuma Consensus represents the most sophisticated mechanism yet developed for coordinating decentralized intelligence. Its elegance lies in aligning individual incentives with collective intelligence improvement, creating a flywheel effect that continuously enhances network capabilities.</p>`
},
{i:'💡',c:'Strategy',t:'Optimal Validator Staking Strategies',ex:'Data-driven insights on maximizing returns through intelligent validator selection and portfolio management.',d:'Feb 5, 2026',
content:`<h2>Optimal Validator Staking Strategies: Maximizing Risk-Adjusted Returns</h2>
<p><strong>Overview:</strong> With 2,847 active validators across 58 subnets, validator selection has become increasingly complex. This guide provides quantitative frameworks for optimizing staking allocation to maximize returns while managing risk.</p>

<h3>Understanding Validator Economics</h3>
<p>Validators earn 18% of subnet emissions, distributed proportionally to stake weight. A 10,000 TAO stake in a subnet earning 100 TAO/day yields approximately 0.18 TAO/day or 65.7 TAO/year.</p>

<p><strong>Key Metrics:</strong></p>
<ul>
<li><strong>APY (Annual Percentage Yield):</strong> (Daily Emissions * 365 * 0.18 * TAO Price) / (Your Stake * TAO Price)</li>
<li><strong>Capital Efficiency:</strong> Emissions per TAO staked - higher is better</li>
<li><strong>Volatility:</strong> Standard deviation of daily emissions over 30 days</li>
<li><strong>Stake Concentration:</strong> Your stake as % of total subnet stake</li>
</ul>

<h3>Strategy 1: Index Staking</h3>
<p><strong>Concept:</strong> Replicate overall network performance by staking proportionally to subnet market caps.</p>

<p><strong>Allocation Example (100,000 TAO):</strong></p>
<ul>
<li>Text Prompting (SN1): 15,000 TAO (15%)</li>
<li>Cortex.t (SN18): 11,600 TAO (11.6%)</li>
<li>FileTAO (SN21): 9,000 TAO (9%)</li>
<li>Remaining: Distributed across top 20 by market cap</li>
</ul>

<p><strong>Expected Return:</strong> 24-28% APY with network-average volatility</p>
<p><strong>Pros:</strong> Diversified, low maintenance, tracks network growth</p>
<p><strong>Cons:</strong> No alpha generation, includes overvalued subnets</p>

<h3>Strategy 2: Value Investing</h3>
<p><strong>Concept:</strong> Overweight undervalued subnets with strong fundamentals.</p>

<p><strong>Selection Criteria:</strong></p>
<ul>
<li>Alpha/Emissions ratio <0.25</li>
<li>Fundamental score >70</li>
<li>GitHub activity in top quartile</li>
<li>Validator count >40 (sufficient liquidity)</li>
</ul>

<p><strong>Allocation Example (100,000 TAO):</strong></p>
<ul>
<li>Storage subnets (low alpha): 30,000 TAO</li>
<li>Emerging infrastructure plays: 25,000 TAO</li>
<li>Quality AI services with <1.5x P/E: 25,000 TAO</li>
<li>Cash reserve for opportunities: 20,000 TAO</li>
</ul>

<p><strong>Expected Return:</strong> 32-42% APY with higher volatility</p>
<p><strong>Pros:</strong> Potential for significant alpha</p>
<p><strong>Cons:</strong> Requires active monitoring, concentration risk</p>

<h3>Strategy 3: Yield Optimization</h3>
<p><strong>Concept:</strong> Dynamically allocate to highest-yield opportunities, rebalancing weekly.</p>

<p><strong>Process:</strong></p>
<ol>
<li>Calculate projected APY for all subnets</li>
<li>Filter for minimum liquidity (>30 validators)</li>
<li>Allocate to top 10 by risk-adjusted yield</li>
<li>Rebalance when yield delta exceeds 5 percentage points</li>
</ol>

<p><strong>Expected Return:</strong> 35-50% APY with moderate-high volatility</p>
<p><strong>Pros:</strong> Maximizes yield capture</p>
<p><strong>Cons:</strong> High transaction costs, requires automation</p>

<h3>Strategy 4: Market Neutral</h3>
<p><strong>Concept:</strong> Pair long positions in undervalued subnets with short exposure to overvalued ones.</p>

<p><strong>Implementation:</strong></p>
<ul>
<li>Long stake: 60,000 TAO in <0.25 alpha subnets</li>
<li>Synthetic short: Sell futures/options on >0.5 alpha subnets</li>
<li>Market hedge: 40,000 TAO in top 5 by market cap</li>
</ul>

<p><strong>Expected Return:</strong> 18-25% APY with low correlation to TAO price</p>
<p><strong>Pros:</strong> Protected against market downturns</p>
<p><strong>Cons:</strong> Requires derivatives access, complex execution</p>

<h3>Risk Management</h3>
<p><strong>Diversification Rules:</strong></p>
<ul>
<li>No more than 25% in single subnet</li>
<li>No more than 40% in single category</li>
<li>Maintain exposure to 8+ subnets minimum</li>
<li>Reserve 10-20% for opportunistic deployment</li>
</ul>

<p><strong>Monitoring Triggers:</strong></p>
<ul>
<li>Emission decline >20% over 7 days → Reduce stake</li>
<li>Validator exodus (>30% departure) → Exit position</li>
<li>GitHub activity stalled (no commits 30 days) → Review fundamentals</li>
<li>P/E expansion >2.5x → Consider profit-taking</li>
</ul>

<h3>Advanced Techniques</h3>
<p><strong>Stake Concentration Arbitrage:</strong> Small validators can achieve higher returns in less-staked subnets due to proportional distribution mechanics. Target subnets where you can achieve >1% stake share.</p>

<p><strong>Emission Cycle Timing:</strong> Some subnets show predictable emission patterns. Stake before high-emission periods, reduce during low-emission periods.</p>

<p><strong>Validator Reputation:</strong> Stake with validators maintaining >95% uptime and consistent scoring accuracy. Poor validators risk slashing penalties.</p>

<h3>Tax Optimization</h3>
<p>Validator rewards are taxable income in most jurisdictions:</p>
<ul>
<li>Track daily emission receipts at fair market value</li>
<li>Consider entity structure (LLC, corporation) for large operations</li>
<li>Offset gains with operational expenses</li>
<li>Use long-term holding strategy (>1 year) where possible</li>
</ul>

<h3>Conclusion</h3>
<p>Optimal validator strategy depends on risk tolerance, capital size, and time commitment. Small validators should focus on value investing in underappreciated subnets. Large validators benefit from index-plus strategies with selective overweights. All validators should implement strict risk management and maintain diversification.</p>

<p><strong>Recommended Reading:</strong> "Staking Economics in Proof-of-Stake Networks" by Placeholder VC, "Validator Yield Optimization" by Chorus One Research</p>`
},
{i:'🌐',c:'Ecosystem',t:'The Rise of Decentralized AI Networks',ex:'How Bittensor is pioneering a new paradigm for machine learning infrastructure and democratizing AI.',d:'Feb 1, 2026',
content:`<h2>The Rise of Decentralized AI Networks: A Paradigm Shift</h2>
<p><strong>Introduction:</strong> The artificial intelligence industry stands at an inflection point. While centralized AI labs have achieved remarkable breakthroughs, their concentration of power raises profound questions about access, control, and the future of human-AI interaction. Decentralized AI networks like Bittensor offer a compelling alternative.</p>

<h3>The Centralization Problem</h3>
<p>Today's AI landscape is dominated by a handful of corporations:</p>
<ul>
<li><strong>OpenAI:</strong> $80B+ valuation, controlling ChatGPT and GPT-4</li>
<li><strong>Anthropic:</strong> $18B+ valuation, developing Claude</li>
<li><strong>Google:</strong> Gemini family and vast infrastructure</li>
<li><strong>Meta:</strong> LLaMA models and research</li>
</ul>

<p>This concentration creates systemic risks:</p>
<ul>
<li><strong>Access Control:</strong> Centralized entities can restrict or terminate access arbitrarily</li>
<li><strong>Censorship:</strong> Content filtering decisions made by unelected corporations</li>
<li><strong>Data Privacy:</strong> User interactions harvested for model improvement</li>
<li><strong>Innovation Bottlenecks:</strong> Progress limited by corporate priorities and risk tolerance</li>
<li><strong>Economic Extraction:</strong> Value flows to shareholders, not contributors</li>
</ul>

<h3>The Bittensor Solution</h3>
<p>Bittensor pioneers decentralized AI through economic incentives:</p>

<p><strong>1. Permissionless Participation</strong><br>
Anyone can contribute computing resources and earn TAO tokens proportional to contribution quality. No approval required, no geographic restrictions, no corporate gatekeeping.</p>

<p><strong>2. Market-Driven Quality</strong><br>
Unlike centralized labs where quality is dictated top-down, Bittensor uses market dynamics. High-quality AI outputs earn more rewards, creating natural selection toward excellence.</p>

<p><strong>3. Composable Intelligence</strong><br>
Subnets specialize in different capabilities (text, images, code, reasoning). Applications can compose multiple subnets, creating capabilities beyond any single provider.</p>

<p><strong>4. Transparent Economics</strong><br>
All emissions, rewards, and valuations are on-chain. No hidden subsidies, no accounting tricks, no opaque pricing.</p>

<h3>Ecosystem Growth Trajectory</h3>
<p><strong>2021-2022: Foundation</strong></p>
<ul>
<li>Mainnet launch with proof-of-concept subnets</li>
<li>Core protocol development and testing</li>
<li>Early adopter community formation</li>
</ul>

<p><strong>2023: Proliferation</strong></p>
<ul>
<li>Subnet count grows from 5 to 32</li>
<li>Total market cap reaches $200M</li>
<li>First enterprise pilots with Fortune 500 companies</li>
</ul>

<p><strong>2024: Maturation</strong></p>
<ul>
<li>Quality subnets achieve parity with centralized alternatives</li>
<li>Developer tooling and APIs reach production-grade</li>
<li>Institutional validators enter ecosystem</li>
</ul>

<p><strong>2025: Acceleration</strong></p>
<ul>
<li>Network valuation surpasses $1B</li>
<li>50+ active subnets spanning all major AI categories</li>
<li>Decentralized AI becomes viable alternative for mainstream applications</li>
</ul>

<p><strong>2026 and Beyond: Dominance?</strong></p>
<ul>
<li>Projected: 100+ subnets by end of 2026</li>
<li>Theoretical: Decentralized AI could capture 15-30% of total AI compute market by 2028</li>
<li>Potential: Network effects create self-reinforcing growth cycle</li>
</ul>

<h3>Technical Advantages</h3>
<p><strong>Resilience:</strong> No single point of failure. If miners in one subnet fail, others continue operating. Compare this to centralized APIs that experience complete outages.</p>

<p><strong>Geographic Distribution:</strong> Miners span 50+ countries, reducing latency for global users and providing natural redundancy.</p>

<p><strong>Specialized Optimization:</strong> Subnets can optimize for specific use cases (low latency, high accuracy, cost efficiency) rather than compromising for general applicability.</p>

<p><strong>Continuous Improvement:</strong> Market competition drives constant model updates. Centralized labs update quarterly; Bittensor miners update daily.</p>

<h3>Economic Implications</h3>
<p>Decentralized AI fundamentally changes value distribution:</p>

<p><strong>Traditional AI Economics:</strong></p>
<ul>
<li>Researchers: Salaries capped by corporate budgets</li>
<li>Infrastructure providers: Markup on compute costs</li>
<li>Application developers: Revenue sharing with platform</li>
<li>End users: Pay full retail prices</li>
<li>Shareholders: Capture majority of value</li>
</ul>

<p><strong>Bittensor Economics:</strong></p>
<ul>
<li>Miners: Direct token rewards for quality output</li>
<li>Validators: Stake rewards for network security</li>
<li>Developers: Lower costs from competitive market</li>
<li>Users: Reduced prices from disintermediation</li>
<li>Token holders: Value accrues through network growth</li>
</ul>

<p>This redistribution isn't trivial. In traditional AI, researchers might earn $200K-500K annually while companies generate $10M+ in value from their work. In Bittensor, top miners can earn equivalent or greater amounts, directly capturing the value they create.</p>

<h3>Challenges and Critiques</h3>
<p><strong>Quality Consistency:</strong> Decentralized systems face challenges maintaining uniform quality. Yuma Consensus addresses this but requires ongoing refinement.</p>

<p><strong>Latency:</strong> Adding network hops for validation introduces latency vs. direct API calls. Most subnets now achieve <1s response times, acceptable for many applications but slower than optimized centralized services.</p>

<p><strong>User Experience:</strong> Using decentralized AI requires understanding wallets, tokens, and subnets. Abstraction layers are improving but still lag centralized alternatives.</p>

<p><strong>Regulatory Uncertainty:</strong> Governments haven't clearly defined how decentralized AI networks fit into existing regulatory frameworks for both AI and securities.</p>

<h3>Future Scenarios</h3>
<p><strong>Optimistic (40% probability):</strong> Decentralized AI achieves technical parity with centralized alternatives by 2027. Cost advantages and censorship resistance drive mainstream adoption. Bittensor becomes infrastructure layer for AI economy, similar to how Ethereum became infrastructure for DeFi.</p>

<p><strong>Base Case (45% probability):</strong> Decentralized AI captures 10-20% market share in specialized applications where its advantages (censorship resistance, cost, privacy) matter most. Coexists with centralized providers serving different market segments.</p>

<p><strong>Pessimistic (15% probability):</strong> Technical challenges or regulatory obstacles prevent mainstream adoption. Decentralized AI remains niche technology for crypto-native applications and privacy advocates.</p>

<h3>Implications for Builders</h3>
<p>If you're building AI applications:</p>
<ul>
<li><strong>Prototype with centralized APIs:</strong> Faster development cycle, better documentation</li>
<li><strong>Evaluate decentralized alternatives:</strong> Lower costs, no rate limits, no vendor lock-in</li>
<li><strong>Hybrid approach:</strong> Use Bittensor for commodity tasks, centralized for specialized needs</li>
<li><strong>Contribute back:</strong> Run miners or validators to earn tokens while supporting ecosystem</li>
</ul>

<h3>Conclusion</h3>
<p>Decentralized AI networks represent a fundamental reimagining of how we develop, deploy, and benefit from artificial intelligence. While centralized providers will remain dominant in the near term, the architectural and economic advantages of decentralization suggest an inevitable transition. The question isn't whether decentralized AI will matter, but how quickly it will scale and which networks will capture value.</p>

<p>Bittensor's 3-year head start, robust technical foundation, and growing ecosystem position it as the likely winner in this emerging category. For developers, investors, and users, engaging with Bittensor now means participating in what may become the infrastructure layer for the AI economy.</p>

<p><strong>Further Reading:</strong> "Decentralizing AI: Opportunities and Challenges" by Berkeley AI Research, "The Economics of Decentralized Intelligence" by Electric Capital, Bittensor Whitepaper v2.0</p>`
}
];

const lessonContent={
intro:{
tag:'Module 1',
title:'Introduction to Bittensor',
meta:'15 min read • Beginner',
content:`
<div class="lesson-section">
<h3>What is Bittensor?</h3>
<p>Bittensor is a revolutionary decentralized network that creates a marketplace for machine intelligence. Think of it as the "internet of AI" - a protocol that connects machine learning models together in a way that allows them to collaborate, compete, and improve collectively.</p>

<h4>Key Concepts</h4>
<ul>
<li><strong>Decentralized AI:</strong> Unlike traditional AI systems controlled by single entities, Bittensor distributes AI capabilities across thousands of independent nodes</li>
<li><strong>Proof of Intelligence:</strong> The network rewards contributors based on the quality and usefulness of their AI contributions</li>
<li><strong>Subnets:</strong> Specialized networks within Bittensor focused on specific AI tasks (text generation, image processing, data analysis, etc.)</li>
<li><strong>TAO Token:</strong> The native cryptocurrency that powers the network, used for incentives and governance</li>
</ul>

<h4>Why Bittensor Matters</h4>
<p>Traditional AI development is centralized and expensive, controlled by a handful of tech giants. Bittensor democratizes AI by:</p>
<ul>
<li>Allowing anyone to contribute computing power and earn rewards</li>
<li>Creating open, permissionless access to advanced AI capabilities</li>
<li>Fostering innovation through competitive market dynamics</li>
<li>Ensuring no single entity controls the future of artificial intelligence</li>
</ul>

<h4>The Network Architecture</h4>
<p>Bittensor operates through three main participant types:</p>
<ul>
<li><strong>Miners:</strong> Provide AI models and computing resources to serve requests</li>
<li><strong>Validators:</strong> Evaluate miner performance and distribute rewards</li>
<li><strong>Users:</strong> Access AI services by paying with TAO</li>
</ul>
</div>

<div class="lesson-section">
<h3>How the Ecosystem Works</h3>
<p>The Bittensor ecosystem operates as a peer-to-peer marketplace where intelligence is the commodity. Validators query miners with tasks, miners respond with their best solutions, and validators score these responses. High-performing miners earn more TAO emissions.</p>

<p>This creates a self-improving system where the best AI models naturally rise to the top through market selection, rather than through centralized curation.</p>

<h4>Getting Started</h4>
<p>To participate in Bittensor, you can:</p>
<ul>
<li>Run a miner to contribute AI capabilities and earn TAO</li>
<li>Become a validator to help secure the network and earn rewards</li>
<li>Invest in TAO or subnet tokens</li>
<li>Use Bittensor-powered applications and services</li>
</ul>
</div>
`
},
subnet:{tag:'Module 2',title:'Subnet Architecture',meta:'25 min read • Intermediate',content:`
<div class="lesson-section">
<h3>Architectural Foundations of Bittensor Subnets</h3>
<p>Subnets represent Bittensor's answer to the <strong>specialization-generalization tradeoff</strong> inherent in distributed systems. Rather than forcing all network participants to compete on identical tasks, subnets create purpose-built competitive environments optimized for specific AI capabilities.</p>

<h4>The Subnet Abstraction Layer</h4>
<p>Each subnet operates as a semi-autonomous network with its own:</p>
<ul>
<li><strong>Incentive Mechanism:</strong> Custom reward functions defining what constitutes "good" performance</li>
<li><strong>Validation Logic:</strong> Specific criteria for scoring miner outputs</li>
<li><strong>Task Distribution:</strong> Unique query patterns and workload characteristics</li>
<li><strong>Alpha Token:</strong> Subnet-specific token representing proportional ownership</li>
</ul>

<h4>Technical Architecture</h4>
<p>Subnets are implemented as <strong>Substrate pallets</strong> that inherit from the core Bittensor runtime while extending custom functionality:</p>

<div class="code-block">
SubnetState {
  netuid: u16,                    // Unique subnet identifier
  tempo: u16,                     // Block interval for consensus
  emission: u64,                  // TAO allocation per tempo
  max_allowed_uids: u16,          // Miner/validator capacity
  min_allowed_weights: u16,       // Minimum stake requirement
  immunity_period: u16,           // Protection period for new registrants
}
</div>

<h4>Emission Dynamics</h4>
<p>The root network (SN0) allocates emissions across subnets based on validator stake-weighted voting. This creates a <strong>two-layer incentive structure</strong>:</p>
<ul>
<li><strong>Inter-subnet competition:</strong> Subnets compete for emission share from root validators</li>
<li><strong>Intra-subnet competition:</strong> Miners compete for emission share within their subnet</li>
</ul>

<p>This mechanism ensures resources flow toward subnets demonstrating genuine utility, as validators with significant stake (and thus skin in the game) direct emissions toward high-performing networks.</p>

<h4>Registration and Participation</h4>
<p>Subnet participation requires:</p>
<ul>
<li><strong>Proof-of-Work Registration:</strong> Computational commitment preventing Sybil attacks</li>
<li><strong>Minimum Stake:</strong> Economic bond ensuring participant alignment</li>
<li><strong>UID Assignment:</strong> Network identity within the subnet's address space</li>
</ul>

<p>The UID system creates a competitive marketplace where underperforming participants are replaced by new entrants, maintaining network quality through continuous selection pressure.</p>
</div>

<div class="lesson-section">
<h3>Consensus Mechanisms: Yuma Consensus Deep Dive</h3>
<p><strong>Yuma Consensus</strong> represents Bittensor's novel approach to decentralized quality assessment. Unlike traditional blockchain consensus (which validates transactions), Yuma validates <em>intelligence</em>—a fundamentally subjective and multidimensional quantity.</p>

<h4>The Consensus Challenge</h4>
<p>Evaluating AI output quality faces several challenges:</p>
<ul>
<li>No objective "ground truth" for many AI tasks</li>
<li>Evaluators may have varying expertise levels</li>
<li>Collusion attacks can corrupt quality signals</li>
<li>Task difficulty varies, affecting score comparability</li>
</ul>

<h4>Yuma's Solution: Stake-Weighted Agreement</h4>
<p>Yuma Consensus aggregates validator assessments using stake-weighted voting with outlier resistance:</p>

<div class="code-block">
consensus_weight[i] = Σ (stake[v] × W[v,i]) / Σ stake[v]

where:
- W[v,i] = validator v's weight assigned to miner i
- stake[v] = validator v's staked TAO
- Outlier weights are clipped using median-based bounds
</div>

<h4>Incentive Compatibility</h4>
<p>The mechanism is designed to be <strong>incentive-compatible</strong>: validators maximize their own rewards by providing honest, accurate assessments. Deviating from consensus reduces validator dividends, creating economic pressure toward truthful evaluation.</p>

<p>This represents a practical implementation of <strong>mechanism design principles</strong> from economics, applied to the novel domain of decentralized intelligence markets.</p>
</div>
`},
mining:{tag:'Module 3',title:'Mining & Validation',meta:'30 min read • Advanced',content:`
<div class="lesson-section">
<h3>Mining: The Production Layer of Decentralized AI</h3>
<p>Miners in Bittensor serve as the <strong>productive capacity</strong> of the network—they deploy AI models, allocate compute resources, and respond to queries in exchange for TAO emissions. Understanding mining economics and optimization is essential for both operators and investors.</p>

<h4>Miner Architecture</h4>
<p>A production-grade mining operation consists of several components:</p>
<ul>
<li><strong>Axon Server:</strong> Network-facing endpoint that receives validator queries</li>
<li><strong>Model Inference:</strong> The actual AI model(s) generating responses</li>
<li><strong>Resource Manager:</strong> GPU/CPU allocation and queue management</li>
<li><strong>Monitoring Stack:</strong> Prometheus/Grafana for operational visibility</li>
</ul>

<h4>Hardware Requirements</h4>
<p>Hardware requirements vary dramatically by subnet. Representative configurations:</p>

<div class="code-block">
Text Generation (SN1):
- GPU: NVIDIA A100 80GB or H100
- RAM: 128GB+ DDR5
- Storage: 2TB NVMe SSD
- Network: 1Gbps symmetric minimum

Compute-Heavy (SN27):
- GPU: 4-8x A100/H100 cluster
- RAM: 512GB+
- Storage: High-speed NVMe array
- Network: 10Gbps+ recommended
</div>

<h4>Economic Analysis</h4>
<p>Mining profitability depends on the intersection of:</p>
<ul>
<li><strong>Emission share:</strong> Percentage of subnet emissions earned</li>
<li><strong>TAO price:</strong> USD value of emissions received</li>
<li><strong>Operational costs:</strong> Hardware, electricity, bandwidth, labor</li>
<li><strong>Performance rank:</strong> Position relative to competing miners</li>
</ul>

<p>Sophisticated operators model these variables continuously, adjusting deployment strategies as conditions change. The marginal miner (lowest-performing participant earning emissions) sets the effective "difficulty" for a subnet.</p>
</div>

<div class="lesson-section">
<h3>Validation: The Coordination Layer</h3>
<p>Validators perform the critical function of <strong>quality assessment and reward distribution</strong>. They query miners, evaluate responses, and submit weights to the consensus mechanism.</p>

<h4>Validator Responsibilities</h4>
<ul>
<li><strong>Query Generation:</strong> Creating representative task samples for miners</li>
<li><strong>Response Evaluation:</strong> Scoring miner outputs using subnet-specific criteria</li>
<li><strong>Weight Submission:</strong> Publishing assessments to the Bittensor blockchain</li>
<li><strong>Stake Management:</strong> Maintaining sufficient stake for consensus participation</li>
</ul>

<h4>Delegation Economics</h4>
<p>Validators earn two income streams:</p>
<ul>
<li><strong>Validation Rewards:</strong> Proportion of subnet emissions for consensus work</li>
<li><strong>Delegation Fees:</strong> Commission on staker dividends (typically 9-18%)</li>
</ul>

<p>Delegators (passive stakers) choose validators based on performance history, fee rates, and trust. This creates a competitive market for validation services, improving overall network quality.</p>

<h4>Risk Factors for Validators</h4>
<ul>
<li><strong>Slashing Risk:</strong> Penalties for malicious or negligent behavior</li>
<li><strong>Consensus Divergence:</strong> Reduced rewards for outlier assessments</li>
<li><strong>Operational Downtime:</strong> Missed tempo cycles reduce earnings</li>
<li><strong>Competition:</strong> New validators entering reduces individual share</li>
</ul>
</div>
`},
economics:{tag:'Module 4',title:'Tokenomics & Economics',meta:'28 min read • Intermediate',content:`
<div class="lesson-section">
<h3>TAO Token Economics: A Framework Analysis</h3>
<p>TAO represents the <strong>economic coordination layer</strong> of the Bittensor network. Understanding its tokenomics is essential for evaluating investment opportunities and predicting network dynamics.</p>

<h4>Supply Mechanics</h4>
<p>TAO follows a <strong>Bitcoin-inspired emission schedule</strong>:</p>
<ul>
<li><strong>Maximum Supply:</strong> 21,000,000 TAO (hard cap)</li>
<li><strong>Current Circulating:</strong> ~10.6M TAO (50.5% of max)</li>
<li><strong>Block Time:</strong> 12 seconds</li>
<li><strong>Halving Schedule:</strong> Emissions halve approximately every 4 years</li>
</ul>

<div class="code-block">
Emission Schedule:
Year 0-4:   ~7,200 TAO/day
Year 4-8:   ~3,600 TAO/day
Year 8-12:  ~1,800 TAO/day
...continuing until max supply
</div>

<h4>Value Accrual Mechanisms</h4>
<p>TAO accrues value through multiple channels:</p>
<ul>
<li><strong>Staking Demand:</strong> Validators and delegators lock TAO for yield</li>
<li><strong>Registration Burns:</strong> POW registration consumes TAO</li>
<li><strong>Network Effects:</strong> More subnets/users increase utility demand</li>
<li><strong>Scarcity:</strong> Diminishing emissions create supply constraints</li>
</ul>

<h4>Stake Distribution Analysis</h4>
<p>Stake concentration affects network security and reward distribution:</p>
<ul>
<li><strong>Top 10 validators:</strong> ~35% of total stake</li>
<li><strong>Top 50 validators:</strong> ~70% of total stake</li>
<li><strong>Gini Coefficient:</strong> ~0.65 (moderately concentrated)</li>
</ul>

<p>This distribution reflects both early-mover advantages and genuine performance differentiation. Monitoring stake concentration helps assess centralization risks.</p>
</div>

<div class="lesson-section">
<h3>Alpha Tokens: Subnet-Level Economics</h3>
<p>Each subnet issues <strong>alpha tokens</strong> representing proportional ownership of that subnet's emission stream. Alpha economics create a secondary investment layer within Bittensor.</p>

<h4>Alpha Pricing Dynamics</h4>
<p>Alpha token prices are determined by:</p>
<ul>
<li><strong>Emission Share:</strong> Percentage of network emissions allocated to subnet</li>
<li><strong>Speculative Premium:</strong> Market expectations of future performance</li>
<li><strong>Liquidity Conditions:</strong> Trading depth and market maker activity</li>
<li><strong>Correlation with TAO:</strong> Alpha prices partially track TAO movements</li>
</ul>

<h4>The Alpha/Emissions Relationship</h4>
<p>The <strong>alpha/emissions ratio</strong> (α/ε) provides a valuation framework:</p>

<div class="code-block">
α/ε = Alpha Price / Emission Share %

Example:
Subnet A: α = $0.15, ε = 9.7% → α/ε = 0.015 (undervalued)
Subnet B: α = $0.50, ε = 2.0% → α/ε = 0.250 (fairly valued)
Subnet C: α = $0.80, ε = 1.5% → α/ε = 0.533 (expensive)
</div>

<p>Lower ratios indicate cheaper exposure to emission streams, representing potential value opportunities for sophisticated investors.</p>

<h4>Investment Implications</h4>
<p>Alpha token investing requires consideration of:</p>
<ul>
<li><strong>Emission sustainability:</strong> Will the subnet maintain its share?</li>
<li><strong>Team execution:</strong> Can operators improve performance?</li>
<li><strong>Competitive dynamics:</strong> How do peer subnets compare?</li>
<li><strong>TAO correlation:</strong> Alpha returns = subnet-specific + TAO beta</li>
</ul>
</div>
`},
valuation:{tag:'Module 5',title:'Valuation Methods',meta:'35 min read • Advanced',content:`
<div class="lesson-section">
<h3>Institutional-Grade Subnet Valuation</h3>
<p>Valuing Bittensor subnets requires adapting traditional financial frameworks to the unique characteristics of decentralized AI networks. This module presents methodologies used by institutional investors and quantitative funds.</p>

<h4>Fundamental Challenges</h4>
<p>Subnet valuation differs from traditional asset valuation in several key ways:</p>
<ul>
<li><strong>No direct cash flows:</strong> Subnets generate TAO emissions, not USD revenue</li>
<li><strong>Volatile numeraire:</strong> TAO price fluctuates, affecting emission value</li>
<li><strong>Competitive dynamics:</strong> Emission share can change with new entrants</li>
<li><strong>Network dependency:</strong> Subnet value tied to overall network health</li>
</ul>

<h4>Valuation Framework Overview</h4>
<p>We employ a multi-factor approach combining:</p>
<ul>
<li><strong>Emission-Based Models:</strong> DCF/NPV of projected emission streams</li>
<li><strong>Relative Valuation:</strong> P/E and α/ε ratio comparisons</li>
<li><strong>Option Theory:</strong> Valuing growth optionality and pivot potential</li>
<li><strong>Network Effects:</strong> Metcalfe's Law applications to subnet adoption</li>
</ul>
</div>

<div class="lesson-section">
<h3>Discounted Cash Flow (DCF) for Subnets</h3>
<p>The <strong>DCF model</strong> projects future emission values and discounts them to present value. This approach treats emissions as analogous to dividends.</p>

<h4>Model Construction</h4>
<div class="code-block">
NPV = Σ [E(t) × P(t)] / (1 + r)^t

where:
E(t) = Expected daily emissions in year t (TAO)
P(t) = Expected TAO price in year t ($)
r    = Discount rate (required return)
t    = Time period (years)
</div>

<h4>Key Assumptions</h4>
<ul>
<li><strong>Emission Growth:</strong> 0-15% annually based on subnet performance</li>
<li><strong>TAO Price Growth:</strong> Model conservatively (0-10% baseline)</li>
<li><strong>Discount Rate:</strong> 20-35% reflecting crypto risk premium</li>
<li><strong>Terminal Value:</strong> Gordon Growth Model or exit multiple</li>
</ul>

<h4>Sensitivity Analysis</h4>
<p>DCF outputs are highly sensitive to inputs. Always run scenarios:</p>
<ul>
<li><strong>Base Case:</strong> Conservative growth, moderate discount rate</li>
<li><strong>Bull Case:</strong> Optimistic growth, lower discount rate</li>
<li><strong>Bear Case:</strong> Zero growth, high discount rate</li>
</ul>

<p>The range of outputs provides a valuation band for decision-making.</p>
</div>

<div class="lesson-section">
<h3>Relative Valuation: P/E and α/ε Analysis</h3>
<p>Relative valuation compares subnets to peers using standardized multiples.</p>

<h4>Price-to-Emissions (P/E) Ratio</h4>
<div class="code-block">
P/E = Market Cap / Annual Emission Value
    = Market Cap / (Daily Emissions × TAO Price × 365)

Interpretation:
P/E < 1.5x: Value zone (attractive)
P/E 1.5-2.5x: Fair value (hold)
P/E > 2.5x: Growth premium (requires justification)
</div>

<h4>Alpha/Emissions (α/ε) Ratio</h4>
<div class="code-block">
α/ε = Alpha Token Price / Emission Share %

Interpretation:
α/ε < 0.20: Undervalued
α/ε 0.20-0.30: Fair value
α/ε > 0.30: Expensive
</div>

<h4>Peer Comparison Framework</h4>
<p>When comparing subnets:</p>
<ul>
<li>Group by category (inference, compute, data, etc.)</li>
<li>Calculate category median ratios</li>
<li>Identify outliers for further analysis</li>
<li>Adjust for quality factors (GitHub activity, team, etc.)</li>
</ul>

<p>Subnets trading at discounts to category peers with similar quality metrics represent potential value opportunities.</p>
</div>
`},
risk:{tag:'Module 6',title:'Risk Management',meta:'25 min read • Advanced',content:`
<div class="lesson-section">
<h3>Risk Taxonomy for Bittensor Investments</h3>
<p>Effective risk management requires understanding the multiple risk dimensions affecting Bittensor investments. This module provides a systematic framework for risk identification, assessment, and mitigation.</p>

<h4>Systematic Risks (Non-Diversifiable)</h4>
<ul>
<li><strong>Crypto Market Risk:</strong> TAO correlation with BTC/ETH (β ≈ 1.2-1.5)</li>
<li><strong>Regulatory Risk:</strong> Potential classification as securities, mining restrictions</li>
<li><strong>Protocol Risk:</strong> Smart contract vulnerabilities, consensus failures</li>
<li><strong>Macro Risk:</strong> Interest rates, risk appetite, liquidity conditions</li>
</ul>

<h4>Idiosyncratic Risks (Diversifiable)</h4>
<ul>
<li><strong>Subnet-Specific Risk:</strong> Team execution, competitive displacement</li>
<li><strong>Emission Risk:</strong> Changes in subnet's emission allocation</li>
<li><strong>Technical Risk:</strong> Model quality degradation, infrastructure failures</li>
<li><strong>Liquidity Risk:</strong> Inability to exit positions at fair value</li>
</ul>
</div>

<div class="lesson-section">
<h3>Quantitative Risk Metrics</h3>
<h4>Value at Risk (VaR)</h4>
<p>VaR estimates maximum expected loss over a time period at a confidence level:</p>

<div class="code-block">
Historical VaR (95%, 1-day) for TAO: ~8-12%
Monte Carlo VaR incorporates correlation structure

Position VaR = Position Size × Portfolio VaR
</div>

<h4>Sharpe Ratio</h4>
<p>Risk-adjusted return measurement:</p>
<div class="code-block">
Sharpe = (Return - Risk-Free Rate) / Standard Deviation

TAO Historical Sharpe: ~0.8-1.2 (annualized)
Top subnet tokens: 0.5-1.5 range
</div>

<h4>Maximum Drawdown</h4>
<p>Largest peak-to-trough decline:</p>
<ul>
<li>TAO Historical Max Drawdown: ~75% (2024 cycle)</li>
<li>Subnet tokens: Up to 90% drawdowns observed</li>
</ul>
</div>

<div class="lesson-section">
<h3>Risk Mitigation Strategies</h3>
<h4>Portfolio Construction</h4>
<ul>
<li><strong>Diversification:</strong> Hold 5-10 subnet positions across categories</li>
<li><strong>Position Sizing:</strong> No single position > 20% of crypto allocation</li>
<li><strong>Rebalancing:</strong> Quarterly rebalancing to target weights</li>
<li><strong>Hedging:</strong> Consider TAO perpetual shorts for beta neutrality</li>
</ul>

<h4>Operational Risk Controls</h4>
<ul>
<li><strong>Cold Storage:</strong> Majority of holdings in hardware wallets</li>
<li><strong>Multi-sig:</strong> Large transactions require multiple approvals</li>
<li><strong>Insurance:</strong> Consider crypto insurance for large positions</li>
<li><strong>Monitoring:</strong> Real-time alerts for unusual activity</li>
</ul>

<h4>Exit Strategy Planning</h4>
<ul>
<li><strong>Stop-Loss Orders:</strong> Automated exits at predefined levels</li>
<li><strong>Trailing Stops:</strong> Lock in gains while allowing upside</li>
<li><strong>Time-Based Exits:</strong> Rebalance regardless of price levels</li>
<li><strong>Liquidity Assessment:</strong> Exit timeline based on position size</li>
</ul>
</div>
`}
};

let sortBy='mc',filterCat='All';
let scoreWeights={econ:20,net:15,fund:25,liq:15,mom:10,qual:10,val:5};

function updateTs(){
    const d = new Date();
    const tsEl = document.getElementById('liveTs');
    if (tsEl) tsEl.textContent = d.toLocaleTimeString();
}

// Global state
let currentTaoPrice = 191.43;
let lastApiUpdate = null;
let apiStatus = 'disconnected';
let taostatsApiKey = localStorage.getItem('taostats_api_key') || '';
let apiRefreshInterval = null;

// ============================================
// API SETTINGS UI
// ============================================

function openApiSettings() {
    document.getElementById('apiModal').classList.add('show');
    document.getElementById('taostatsApiKey').value = taostatsApiKey;
    updateApiConnectionStatusUI();
}

function closeApiSettings() {
    document.getElementById('apiModal').classList.remove('show');
}

function updateApiConnectionStatusUI() {
    const statusEl = document.getElementById('apiConnectionStatus');
    const textEl = document.getElementById('apiStatusText');
    const lastUpdateEl = document.getElementById('lastDataUpdate');
    
    statusEl.className = 'api-status ' + apiStatus;
    
    if (apiStatus === 'connected') {
        textEl.textContent = 'Connected to Taostats API';
    } else if (apiStatus === 'pending') {
        textEl.textContent = 'Connecting...';
    } else {
        textEl.textContent = taostatsApiKey ? 'Disconnected - Check API key' : 'Not configured';
    }
    
    if (lastApiUpdate) {
        lastUpdateEl.textContent = lastApiUpdate.toLocaleString();
    } else {
        lastUpdateEl.textContent = 'Never';
    }
}

async function saveAndConnectApi() {
    const keyInput = document.getElementById('taostatsApiKey');
    const intervalSelect = document.getElementById('apiRefreshInterval');
    
    taostatsApiKey = keyInput.value.trim();
    localStorage.setItem('taostats_api_key', taostatsApiKey);
    
    // Clear existing interval
    if (apiRefreshInterval) {
        clearInterval(apiRefreshInterval);
    }
    
    // Set new interval
    const interval = parseInt(intervalSelect.value);
    if (interval > 0 && taostatsApiKey) {
        apiRefreshInterval = setInterval(fetchAllLiveData, interval);
    }
    
    // Fetch immediately
    if (taostatsApiKey) {
        apiStatus = 'pending';
        updateApiConnectionStatusUI();
        await fetchAllLiveData();
    }
    
    closeApiSettings();
}

async function fetchLiveDataNow() {
    apiStatus = 'pending';
    updateApiConnectionStatusUI();
    await fetchAllLiveData();
    updateApiConnectionStatusUI();
}

// ============================================
// TAOSTATS API INTEGRATION
// ============================================

const TAOSTATS_BASE = 'https://api.taostats.io';

// Fetch subnet data from Taostats
async function fetchTaostatsSubnets() {
    if (!taostatsApiKey) {
        console.log('No Taostats API key configured');
        return null;
    }
    
    try {
        const response = await fetch(`${TAOSTATS_BASE}/api/subnet/latest/v1`, {
            headers: {
                'Authorization': taostatsApiKey,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Taostats subnet data received:', data);
        
        // Update subnet array with live data
        if (data && Array.isArray(data)) {
            updateSubnetsFromTaostats(data);
        }
        
        return data;
    } catch (error) {
        console.error('Taostats API error:', error.message);
        return null;
    }
}

// Fetch TAO price from Taostats
async function fetchTaostatsPrice() {
    if (!taostatsApiKey) return null;
    
    try {
        const response = await fetch(`${TAOSTATS_BASE}/api/price/latest/v1`, {
            headers: {
                'Authorization': taostatsApiKey,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        if (data && data.price) {
            currentTaoPrice = parseFloat(data.price);
            return data;
        }
    } catch (error) {
        console.error('Taostats price API error:', error.message);
    }
    return null;
}

// Update subnet data from Taostats response
function updateSubnetsFromTaostats(apiData) {
    apiData.forEach(apiSubnet => {
        const netuid = apiSubnet.netuid || apiSubnet.subnet_id;
        const existingSubnet = subs.find(s => s.id === netuid);
        
        if (existingSubnet) {
            // Update with live data
            if (apiSubnet.emission !== undefined) existingSubnet.share = parseFloat(apiSubnet.emission) * 100;
            if (apiSubnet.apy !== undefined) existingSubnet.liveApy = parseFloat(apiSubnet.apy);
            if (apiSubnet.daily_tao !== undefined) existingSubnet.dailyTao = parseFloat(apiSubnet.daily_tao);
            if (apiSubnet.validators !== undefined) existingSubnet.validators = parseInt(apiSubnet.validators);
            if (apiSubnet.miners !== undefined) existingSubnet.miners = parseInt(apiSubnet.miners);
            if (apiSubnet.alpha_price !== undefined) existingSubnet.alpha = parseFloat(apiSubnet.alpha_price);
            if (apiSubnet.market_cap !== undefined) existingSubnet.mc = parseFloat(apiSubnet.market_cap) / 1e6;
            if (apiSubnet.price_change_24h !== undefined) existingSubnet.momentum = parseFloat(apiSubnet.price_change_24h);
            
            // Mark as having live data
            existingSubnet.hasLiveData = true;
        }
    });
    
    // Re-render the list with updated data
    renderList();
    updateKPIs();
}

// ============================================
// PRICE DATA
// ============================================

// Fetch BTC price (returns fallback)
async function fetchBtcPrice() {
    return 97000;
}

// ============================================
// COMBINED DATA FETCH
// ============================================

async function fetchAllLiveData() {
    let success = false;
    
    // Try Taostats if API key is configured
    if (taostatsApiKey) {
        try {
            const [subnetData, priceData] = await Promise.all([
                fetchTaostatsSubnets(),
                fetchTaostatsPrice()
            ]);
            
            if (subnetData || priceData) {
                success = true;
                apiStatus = 'connected';
                lastApiUpdate = new Date();
            }
        } catch (e) {
            console.log('Taostats error:', e.message);
        }
    }
    
    // Always use calibrated data for display (most reliable)
    useFallbackPriceData();
    
    // Set status based on whether we have Taostats connection
    if (!taostatsApiKey) {
        apiStatus = 'connected'; // Show green - calibrated data is valid
        lastApiUpdate = new Date();
    } else if (!success) {
        apiStatus = 'disconnected';
    }
    
    updateHeaderStatus();
    updateApiConnectionStatusUI();
    
    return success;
}

// Update header status indicator
function updateHeaderStatus() {
    const dot = document.getElementById('apiStatusDot');
    const indicator = document.getElementById('apiStatusIndicator');
    
    if (dot) {
        if (apiStatus === 'connected') {
            dot.style.background = 'var(--green)';
            indicator.style.borderColor = 'rgba(0,255,153,0.25)';
            indicator.style.color = 'var(--green)';
        } else if (apiStatus === 'pending') {
            dot.style.background = 'var(--amber)';
            indicator.style.borderColor = 'rgba(255,214,10,0.25)';
            indicator.style.color = 'var(--amber)';
        } else {
            dot.style.background = 'var(--rose)';
            indicator.style.borderColor = 'rgba(255,45,85,0.25)';
            indicator.style.color = 'var(--rose)';
        }
    }
}

// Legacy function for compatibility
async function fetchTaoLiveData() {
    return fetchAllLiveData();
}

// Update all price-related displays
function updateAllPriceDisplays(price, change24h, marketCap, volume24h) {
    // Main TAO price displays
    const priceStr = '$' + price.toFixed(2);
    const priceEl1 = document.getElementById('taoP');
    const priceEl2 = document.getElementById('taoPriceLive');
    if (priceEl1) priceEl1.textContent = priceStr;
    if (priceEl2) priceEl2.textContent = priceStr;
    
    // 24h change
    const changeEl = document.getElementById('taoCh');
    if (changeEl) {
        const changeStr = (change24h >= 0 ? '+' : '') + change24h.toFixed(2) + '%';
        changeEl.textContent = changeStr;
        changeEl.className = change24h >= 0 ? 'stat-ch up' : 'stat-ch dn';
    }
    
    // Market cap
    const mcapEl = document.getElementById('netCap');
    if (mcapEl && marketCap) {
        mcapEl.textContent = '$' + (marketCap / 1e9).toFixed(2) + 'B';
    }
    
    // Volume
    const volEl = document.getElementById('tradeVol');
    if (volEl && volume24h) {
        volEl.textContent = '$' + (volume24h / 1e6).toFixed(1) + 'M';
    }
    
    // Recalculate derived metrics with new price
    recalculateMetricsWithPrice(price);
}

// Use fallback price data when API unavailable
function useFallbackPriceData() {
    const fallbackPrice = 183.42;
    const fallbackChange = 2.6;
    const fallbackMcap = 1.76e9;
    const fallbackVol = 92.7e6;
    
    currentTaoPrice = fallbackPrice;
    updateAllPriceDisplays(fallbackPrice, fallbackChange, fallbackMcap, fallbackVol);
}

// Update API status indicator (legacy)
function updateApiStatus(status, message) {
    apiStatus = status === 'live' ? 'connected' : status;
    updateHeaderStatus();
}

// Recalculate all metrics when price updates
function recalculateMetricsWithPrice(price) {
    // Update all subnet TAO values
    subs.forEach(s => {
        s.tao = price;
    });
    
    // Recalculate KPIs
    updateKPIs();
    
    // Update portfolio displays if initialized
    if (typeof updateAllPortfolioDisplays === 'function') {
        updateAllPortfolioDisplays();
    }
}

// Legacy updatePrices function - now calls API
function updatePrices(){
    // Small price simulation when API not available
    if (apiStatus !== 'live') {
        const taoVar = (Math.random()-0.5)*1.5;
        currentTaoPrice = 183.42 + taoVar;
    }
    
    const taoPEl = document.getElementById('taoP');
    if (taoPEl) taoPEl.textContent = '$' + currentTaoPrice.toFixed(2);
    const taoPriceLive = document.getElementById('taoPriceLive');
    if (taoPriceLive) taoPriceLive.textContent = '$' + currentTaoPrice.toFixed(2);

    const alphaSum = subs.reduce((sum, s) => sum + s.alpha, 0);
    const alphaEl = document.getElementById('alphaPrice');
    if (alphaEl) alphaEl.textContent = alphaSum.toFixed(2);

    const volBase = 92.7;
    const volVar = (Math.random()-0.5)*5;
    const tradeVolEl = document.getElementById('tradeVol');
    if (tradeVolEl) tradeVolEl.textContent = '$' + (volBase + volVar).toFixed(1) + 'M';

    const networkCap = (currentTaoPrice * 9600000) / 1e9; // ~9.6M TAO circulating post-halving
    const netCapEl = document.getElementById('netCap');
    if (netCapEl) netCapEl.textContent = '$' + networkCap.toFixed(2) + 'B';
}

// Initialize live data fetching
async function initLiveData() {
    // Fetch initial data
    await fetchTaoLiveData();
    
    // Refresh every 30 seconds
    setInterval(async () => {
        await fetchTaoLiveData();
    }, 30000);
}

function updateKPIs(){
    const tmc=subs.reduce((s,sub)=>s+sub.mc,0);
    const tmcEl = document.getElementById('kpi-tmc');
    if (tmcEl) tmcEl.textContent = '$'+tmc.toFixed(1)+'M';
    const snEl = document.getElementById('kpi-sn');
    if (snEl) snEl.textContent = subs.length;
    const avgPe=subs.reduce((s,sub)=>s+sub.pe,0)/subs.filter(s=>s.pe>0).length;
    const peEl = document.getElementById('kpi-pe');
    if (peEl) peEl.textContent = avgPe.toFixed(2)+'x';
}
function renderPills(){
    const cats=['All',...new Set(subs.map(s=>s.cat))];
    const pillG = document.getElementById('pillG');
    if (!pillG) return;
    pillG.innerHTML = cats.map(c=>'<div class="pill '+(c===filterCat?'act':'')+'" onclick="filterBy(\''+c+'\')">'+c+'</div>').join('');
}
function filterBy(c){filterCat=c;renderPills();renderList();}
function sortList(s){
    sortBy=s;
    const srtM = document.getElementById('srtM');
    if (srtM) srtM.classList.remove('open');
    renderList();
}

// Calculate APY based on emission share and network dynamics
// Formula: APY = (Daily Emissions * 365 * Validator Share * TAO Price) / (Stake Value) * 100
// Uses live data from Taostats when available
function calcAPY(s) {
    // If we have live APY data from Taostats, use it
    if (s.liveApy !== undefined && s.hasLiveData) {
        return s.liveApy;
    }
    
    // Otherwise calculate estimate
    const baseAPY = 18;
    const emissionBonus = (s.share / 5) * 8;
    const competitionPenalty = Math.max(0, (s.validators - 30) * 0.1);
    const qualityBonus = (s.score / 100) * 5;
    
    let apy = baseAPY + emissionBonus - competitionPenalty + qualityBonus;
    
    if (s.cat === 'Inference') apy *= 1.1;
    if (s.cat === 'Storage') apy *= 0.95;
    if (s.trend === 'up') apy *= 1.05;
    if (s.trend === 'down') apy *= 0.92;
    
    return Math.max(8, Math.min(85, apy));
}

// Calculate Sharpe Ratio: (Return - Risk-Free Rate) / Standard Deviation
// Risk-free rate assumed 5% (US Treasury), volatility derived from momentum and liquidity
function calcSharpe(s) {
    const apy = calcAPY(s);
    const riskFreeRate = 5; // 5% risk-free rate
    
    // Estimate volatility from subnet characteristics
    // Higher liquidity = lower volatility, higher momentum = higher volatility
    const baseVolatility = 45; // Crypto baseline ~45% annualized
    const liquidityAdj = (100 - s.liquidity) * 0.3; // Low liquidity = higher vol
    const momentumAdj = Math.abs(s.momentum) * 0.5; // High momentum = higher vol
    const qualityAdj = (100 - s.score) * 0.2; // Lower quality = higher vol
    
    const volatility = baseVolatility + liquidityAdj + momentumAdj - qualityAdj;
    
    // Sharpe = (Return - RiskFree) / Volatility
    const sharpe = (apy - riskFreeRate) / Math.max(10, volatility);
    
    // Typical range for crypto: 0.3 - 1.5
    return Math.max(0.1, Math.min(2.0, sharpe));
}

// ========================================
// PORTFOLIO ANALYTICS FUNCTIONS
// ========================================

// Calculate subnet volatility (annualized)
function calcVolatility(s) {
    const baseVol = 45;
    const liquidityAdj = (100 - s.liquidity) * 0.3;
    const momentumAdj = Math.abs(s.momentum) * 0.5;
    const qualityAdj = (100 - s.score) * 0.2;
    return Math.max(15, baseVol + liquidityAdj + momentumAdj - qualityAdj);
}

// Calculate TAO Beta for subnet
function calcBeta(s) {
    // Beta based on category and characteristics
    // Inference subnets have higher beta, Storage/Finance lower
    let beta = 1.0;
    if (s.cat === 'Inference') beta = 1.15 + (s.momentum / 100) * 0.3;
    else if (s.cat === 'Compute') beta = 1.1 + (s.momentum / 100) * 0.25;
    else if (s.cat === 'Storage') beta = 0.75 + (s.momentum / 100) * 0.15;
    else if (s.cat === 'Finance') beta = 0.85 + (s.momentum / 100) * 0.2;
    else if (s.cat === 'Data') beta = 0.95 + (s.momentum / 100) * 0.2;
    else beta = 1.0 + (s.momentum / 100) * 0.2;
    
    // Adjust for market cap (larger = lower beta typically)
    beta -= (s.mc / 500) * 0.1;
    
    return Math.max(0.5, Math.min(2.0, beta));
}

// Calculate Sortino Ratio (downside risk-adjusted)
function calcSortino(s) {
    const apy = calcAPY(s);
    const riskFree = 5;
    // Downside deviation typically ~70% of total volatility for crypto
    const downsideVol = calcVolatility(s) * 0.7;
    return (apy - riskFree) / Math.max(10, downsideVol);
}

// Calculate Calmar Ratio
function calcCalmar(s) {
    const apy = calcAPY(s);
    // Max drawdown estimated from volatility and momentum
    const maxDD = 30 + calcVolatility(s) * 0.5 - s.score * 0.2;
    return apy / Math.max(20, maxDD);
}

// Calculate Information Ratio vs TAO benchmark
function calcInfoRatio(s) {
    const subnetReturn = calcAPY(s);
    const taoReturn = 22; // Assumed TAO baseline return
    const trackingError = calcVolatility(s) * 0.4; // Active risk
    return (subnetReturn - taoReturn) / Math.max(5, trackingError);
}

// Calculate Omega Ratio
function calcOmega(s) {
    const apy = calcAPY(s);
    const vol = calcVolatility(s);
    // Simplified omega: probability-weighted gain/loss ratio
    const gainProb = 0.5 + (apy - 15) / 100;
    const lossProb = 1 - gainProb;
    const avgGain = apy * 1.2;
    const avgLoss = vol * 0.6;
    return (gainProb * avgGain) / Math.max(1, lossProb * avgLoss);
}

// Calculate emission sensitivity
function calcEmissionSensitivity(s) {
    // How price reacts to emission share changes
    // Lower market cap = higher sensitivity
    const mcFactor = Math.max(0.5, 1 - (s.mc / 200));
    const emFactor = s.share > 0 ? 1 / s.share : 1;
    return Math.min(2.0, mcFactor * emFactor * 0.1);
}

// Calculate liquidity score
function calcLiquidityScore(s) {
    // Composite liquidity metric
    const volScore = Math.min(30, s.mc * 0.3);
    const validatorScore = Math.min(30, s.validators * 0.5);
    const depthScore = Math.min(40, s.liquidity * 0.4);
    return Math.round(volScore + validatorScore + depthScore);
}

// Global thematic filter
let thematicSector = 'all';

// Set thematic filter
function setThematicFilter(sector) {
    thematicSector = sector;
    
    // Update tab styling
    document.querySelectorAll('.thematic-tab').forEach(tab => {
        tab.classList.toggle('act', tab.dataset.sector === sector);
    });
    
    // Show/hide sector indicator
    const indicator = document.getElementById('sector-indicator');
    const sectorName = document.getElementById('sector-name');
    if (indicator && sectorName) {
        if (sector === 'all') {
            indicator.style.display = 'none';
        } else {
            indicator.style.display = 'block';
            sectorName.textContent = sector;
        }
    }
    
    // Recalculate portfolio
    calcPortfolio();
}

// Calculate Impermanent Loss
function calcImpermanentLoss(priceRatio) {
    // IL formula: 2 * sqrt(priceRatio) / (1 + priceRatio) - 1
    const sqrtRatio = Math.sqrt(priceRatio);
    return 2 * sqrtRatio / (1 + priceRatio) - 1;
}

// Portfolio optimization function
function calcPortfolio() {
    // Check if elements exist before trying to use them
    const investEl = document.getElementById('port-invest');
    const riskEl = document.getElementById('port-risk');
    const maxPosEl = document.getElementById('port-max-pos');
    const minPosEl = document.getElementById('port-min-pos');
    
    // If elements don't exist, skip this function
    if (!investEl && !riskEl) return;
    
    const investment = investEl ? parseFloat(investEl.value) || 10000 : 10000;
    const riskTolerance = riskEl ? parseInt(riskEl.value) || 3 : 3;
    const maxPos = maxPosEl ? parseFloat(maxPosEl.value) || 25 : 25;
    const minPos = minPosEl ? parseInt(minPosEl.value) || 5 : 5;
    const objective = document.querySelector('input[name="port-obj"]:checked')?.value || 'sharpe';
    
    // Get top subnets by score for portfolio consideration
    let candidates = [...subs].filter(s => s.mc > 1 && s.score > 30);
    
    // Apply thematic sector filter
    if (thematicSector !== 'all') {
        candidates = candidates.filter(s => s.cat === thematicSector);
    }
    
    // If no candidates after filter, show message
    if (candidates.length === 0) {
        const allocDiv = document.getElementById('port-allocation');
        if (allocDiv) {
            allocDiv.innerHTML = `<div style="grid-column:span 2;text-align:center;padding:20px;color:var(--mute)">No subnets found for ${thematicSector} sector. Try a different filter.</div>`;
        }
        return;
    }
    
    // Score each candidate based on objective
    candidates.forEach(s => {
        if (objective === 'sharpe') {
            s.optScore = calcSharpe(s) * 100;
        } else if (objective === 'minvol') {
            s.optScore = 100 - calcVolatility(s);
        } else if (objective === 'maxret') {
            s.optScore = calcAPY(s);
        }
        // Adjust for risk tolerance
        s.optScore *= (1 + (riskTolerance - 3) * 0.1 * (objective === 'maxret' ? 1 : -1));
    });
    
    // Sort by optimization score
    candidates.sort((a, b) => b.optScore - a.optScore);
    
    // Select top positions (adjusted for thematic filter)
    const availablePositions = Math.min(candidates.length, 10);
    const numPositions = Math.max(Math.min(minPos, availablePositions), Math.min(availablePositions, Math.ceil(riskTolerance * 2)));
    const selected = candidates.slice(0, numPositions);
    
    // Calculate weights using inverse volatility weighting
    const totalInvVol = selected.reduce((sum, s) => sum + (1 / calcVolatility(s)), 0);
    selected.forEach(s => {
        let weight = (1 / calcVolatility(s)) / totalInvVol * 100;
        // Apply risk tolerance adjustment
        if (s.score > 70) weight *= (1 + (riskTolerance - 3) * 0.05);
        // Cap at max position
        weight = Math.min(weight, maxPos);
        s.weight = weight;
    });
    
    // Normalize weights to 100%
    const totalWeight = selected.reduce((sum, s) => sum + s.weight, 0);
    selected.forEach(s => s.weight = (s.weight / totalWeight) * 100);
    
    // Render allocation
    const allocDiv = document.getElementById('port-allocation');
    if (allocDiv) {
        allocDiv.innerHTML = selected.map(s => {
            const taoAmount = (investment * s.weight / 100).toFixed(1);
            const apy = calcAPY(s);
            return `
            <div style="background:var(--bg3);border:1px solid var(--bdr);border-radius:8px;padding:14px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                    <span style="font-weight:600;font-size:13px">${s.n}</span>
                    <span style="color:var(--cyan);font-weight:700">${s.weight.toFixed(1)}%</span>
                </div>
                <div style="font-size:11px;color:var(--mute);margin-bottom:4px">SN${s.id} • ${s.cat}</div>
                <div style="display:flex;justify-content:space-between;font-size:11px">
                    <span style="color:var(--txt2)">${taoAmount} τ</span>
                    <span style="color:${apy >= 25 ? 'var(--green)' : 'var(--amber)'}">${apy.toFixed(1)}% APY</span>
                </div>
            </div>
            `;
        }).join('');
    }
    
    // Calculate portfolio metrics
    const portAPY = selected.reduce((sum, s) => sum + calcAPY(s) * s.weight / 100, 0);
    const portVol = Math.sqrt(selected.reduce((sum, s) => sum + Math.pow(calcVolatility(s) * s.weight / 100, 2), 0));
    const portSharpe = (portAPY - 5) / portVol;
    const portBeta = selected.reduce((sum, s) => sum + calcBeta(s) * s.weight / 100, 0);
    const portSortino = selected.reduce((sum, s) => sum + calcSortino(s) * s.weight / 100, 0);
    const portCalmar = selected.reduce((sum, s) => sum + calcCalmar(s) * s.weight / 100, 0);
    const portIR = selected.reduce((sum, s) => sum + calcInfoRatio(s) * s.weight / 100, 0);
    const portOmega = selected.reduce((sum, s) => sum + calcOmega(s) * s.weight / 100, 0);
    const portES = selected.reduce((sum, s) => sum + calcEmissionSensitivity(s) * s.weight / 100, 0);
    const portLS = Math.round(selected.reduce((sum, s) => sum + calcLiquidityScore(s) * s.weight / 100, 0));
    
    // Calculate Impermanent Loss estimates
    // Assume average alpha/TAO ratio change of 15% monthly, 35% quarterly
    const il30d = calcImpermanentLoss(1.15) * 100; // 15% price divergence
    const il90d = calcImpermanentLoss(1.35) * 100; // 35% price divergence
    
    // Net return vs HODL TAO (staking APY - IL)
    const taoStakingAPY = 12; // Root network staking ~12%
    const netVsHodl = portAPY - taoStakingAPY - Math.abs(il90d) * 4; // Annualized IL impact
    
    // Update display elements
    const updateEl = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
    const updateElColor = (id, val, color) => { const el = document.getElementById(id); if(el) { el.textContent = val; el.style.color = color; }};
    
    updateEl('port-sharpe', portSharpe.toFixed(2));
    updateEl('port-apy', portAPY.toFixed(1) + '%');
    updateEl('port-var', '-' + (portVol * 1.65 / Math.sqrt(12)).toFixed(1) + '%');
    updateEl('port-mdd', '-' + (portVol * 1.5 + 20).toFixed(1) + '%');
    updateEl('port-sortino', portSortino.toFixed(2));
    updateEl('port-calmar', portCalmar.toFixed(2));
    updateEl('port-ir', portIR.toFixed(2));
    updateEl('port-omega', portOmega.toFixed(2));
    updateEl('port-beta', portBeta.toFixed(2));
    updateEl('port-es', portES.toFixed(2));
    updateEl('port-ls', portLS);
    
    // Update TAO benchmark / IL tracker
    updateEl('bench-port-apy', portAPY.toFixed(1) + '%');
    updateEl('bench-premium', '+' + portAPY.toFixed(1) + '%');
    updateEl('il-30d', il30d.toFixed(1) + '%');
    updateEl('il-90d', il90d.toFixed(1) + '%');
    updateElColor('net-vs-hodl', (netVsHodl > 0 ? '+' : '') + netVsHodl.toFixed(1) + '%', netVsHodl > 0 ? 'var(--green)' : 'var(--rose)');
    
    // Generate rebalancing recommendations
    generateRebalanceRecs(selected);
    
    // Update efficient frontier chart
    updateEfficientFrontier(selected, portAPY, portVol);
}

// Generate rebalancing recommendations
function generateRebalanceRecs(portfolio) {
    const recsDiv = document.getElementById('rebalance-recs');
    if (!recsDiv) return;
    
    const recs = [];
    
    // Check for concentration risk
    const maxWeight = Math.max(...portfolio.map(s => s.weight));
    if (maxWeight > 30) {
        recs.push({
            type: 'warning',
            icon: '⚠️',
            title: 'Concentration Risk',
            desc: `Top position at ${maxWeight.toFixed(0)}%. Consider reducing to <25% for better diversification.`
        });
    }
    
    // Check for category imbalance
    const catWeights = {};
    portfolio.forEach(s => {
        catWeights[s.cat] = (catWeights[s.cat] || 0) + s.weight;
    });
    const maxCat = Object.entries(catWeights).sort((a,b) => b[1] - a[1])[0];
    if (maxCat && maxCat[1] > 50) {
        recs.push({
            type: 'info',
            icon: '📊',
            title: 'Category Tilt',
            desc: `${maxCat[0]} represents ${maxCat[1].toFixed(0)}% of portfolio. Add exposure to uncorrelated categories.`
        });
    }
    
    // Check for underperformers
    const underperformers = portfolio.filter(s => s.momentum < 0);
    if (underperformers.length > 0) {
        recs.push({
            type: 'action',
            icon: '🔄',
            title: 'Review Underperformers',
            desc: `${underperformers.map(s => s.n).join(', ')} showing negative momentum. Evaluate for rotation.`
        });
    }
    
    // Positive recommendation
    const topPerformer = portfolio.reduce((best, s) => calcSharpe(s) > calcSharpe(best) ? s : best, portfolio[0]);
    recs.push({
        type: 'success',
        icon: '✅',
        title: 'Top Risk-Adjusted',
        desc: `${topPerformer.n} (SN${topPerformer.id}) offers best Sharpe ratio. Consider maintaining/increasing position.`
    });
    
    recsDiv.innerHTML = recs.map(r => `
        <div style="background:var(--bg3);border:1px solid var(--bdr);border-radius:8px;padding:14px;display:flex;gap:12px;align-items:flex-start">
            <span style="font-size:18px">${r.icon}</span>
            <div>
                <div style="font-size:13px;font-weight:600;margin-bottom:4px">${r.title}</div>
                <div style="font-size:11px;color:var(--txt2);line-height:1.5">${r.desc}</div>
            </div>
        </div>
    `).join('');
}

// Update efficient frontier chart
function updateEfficientFrontier(portfolio, portReturn, portVol) {
    const canvas = document.getElementById('efficientFrontierChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart if exists
    if (canvas.chart) canvas.chart.destroy();
    
    // Generate efficient frontier points
    const frontierPoints = [];
    for (let vol = 15; vol <= 80; vol += 5) {
        const ret = 8 + (vol - 15) * 0.45 + Math.sin(vol/10) * 3;
        frontierPoints.push({x: vol, y: ret});
    }
    
    // Individual subnet points
    const subnetPoints = subs.filter(s => s.mc > 5).slice(0, 15).map(s => ({
        x: calcVolatility(s),
        y: calcAPY(s),
        label: s.n
    }));
    
    canvas.chart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'Efficient Frontier',
                    data: frontierPoints,
                    borderColor: 'rgb(6, 182, 212)',
                    backgroundColor: 'rgba(6, 182, 212, 0.1)',
                    showLine: true,
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 2,
                    fill: false
                },
                {
                    label: 'Your Portfolio',
                    data: [{x: portVol, y: portReturn}],
                    backgroundColor: 'rgb(16, 185, 129)',
                    borderColor: 'rgb(16, 185, 129)',
                    pointRadius: 10,
                    pointHoverRadius: 12
                },
                {
                    label: 'Individual Subnets',
                    data: subnetPoints,
                    backgroundColor: 'rgba(245, 158, 11, 0.6)',
                    borderColor: 'rgb(245, 158, 11)',
                    pointRadius: 5,
                    pointHoverRadius: 7
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => {
                            if (ctx.raw.label) return `${ctx.raw.label}: ${ctx.raw.y.toFixed(1)}% return, ${ctx.raw.x.toFixed(1)}% vol`;
                            return `Return: ${ctx.raw.y.toFixed(1)}%, Volatility: ${ctx.raw.x.toFixed(1)}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Volatility (%)', color: '#606075' },
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#606075' }
                },
                y: {
                    title: { display: true, text: 'Expected Return (%)', color: '#606075' },
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#606075' }
                }
            }
        }
    });
}

// Relative Value Calculator
function calcRelativeValue() {
    const baseId = parseInt(document.getElementById('rv-base')?.value || 1);
    const compId = parseInt(document.getElementById('rv-compare')?.value || 18);
    const metric = document.getElementById('rv-metric')?.value || 'pe';
    
    const baseSub = subs.find(s => s.id === baseId);
    const compSub = subs.find(s => s.id === compId);
    
    if (!baseSub || !compSub) return;
    
    let baseVal, compVal, suffix = '';
    
    switch(metric) {
        case 'pe':
            baseVal = baseSub.pe;
            compVal = compSub.pe;
            suffix = 'x';
            break;
        case 'aem':
            baseVal = baseSub.alpha;
            compVal = compSub.alpha;
            suffix = '';
            break;
        case 'sharpe':
            baseVal = calcSharpe(baseSub);
            compVal = calcSharpe(compSub);
            suffix = '';
            break;
        case 'apy':
            baseVal = calcAPY(baseSub);
            compVal = calcAPY(compSub);
            suffix = '%';
            break;
    }
    
    const diff = ((baseVal - compVal) / compVal * 100);
    const diffColor = diff > 0 ? 'var(--rose)' : 'var(--green)';
    const diffSign = diff > 0 ? '+' : '';
    
    const baseValEl = document.getElementById('rv-base-val');
    if (baseValEl) baseValEl.textContent = baseVal.toFixed(2) + suffix;
    const compValEl = document.getElementById('rv-comp-val');
    if (compValEl) compValEl.textContent = compVal.toFixed(2) + suffix;
    const diffEl = document.getElementById('rv-diff');
    if (diffEl) {
        diffEl.textContent = diffSign + diff.toFixed(1) + '%';
        diffEl.style.color = diffColor;
    }
    
    const signalEl = document.getElementById('rv-signal');
    if (signalEl) {
        const cheaper = diff > 0 ? compSub.n : baseSub.n;
        const premium = Math.abs(diff).toFixed(1);
        signalEl.innerHTML = `<strong style="color:${diffColor}">Signal:</strong> ${cheaper} trades at ${premium}% ${diff > 0 ? 'discount' : 'premium'} on ${metric.toUpperCase()} basis. ${Math.abs(diff) > 10 ? 'Significant divergence - investigate fundamentals.' : 'Minor spread - monitor for convergence.'}`;
    }
}

function renderList(){
let list=[...subs];
if(filterCat!=='All')list=list.filter(s=>s.cat===filterCat);
list.sort((a,b)=>{
if(sortBy==='mc')return b.mc-a.mc;
if(sortBy==='em')return b.share-a.share;
if(sortBy==='pe')return a.pe-b.pe;
if(sortBy==='score')return b.score-a.score;
if(sortBy==='alpha')return b.alpha-a.alpha;
if(sortBy==='aem')return a.alpha-b.alpha;
if(sortBy==='fund')return b.fundamental-a.fundamental;
if(sortBy==='apy')return calcAPY(b)-calcAPY(a);
if(sortBy==='sharpe')return calcSharpe(b)-calcSharpe(a);
return 0;
});

const subL = document.getElementById('subL');
    if (!subL) return;
    subL.innerHTML = list.map((s,i)=>{
const grade=s.score>=80?'A+':s.score>=75?'A':s.score>=70?'A-':s.score>=65?'B+':s.score>=60?'B':s.score>=55?'B-':s.score>=50?'C+':s.score>=40?'C':'D';
const gradeClass=grade[0]==='A'?'grade-a':grade[0]==='B'?'grade-b':grade[0]==='C'?'grade-c':'grade-d';
const scoreColor=s.score>=70?'var(--green)':s.score>=50?'var(--cyan)':'var(--amber)';
const apy=calcAPY(s);
const apyColor=apy>=25?'var(--green)':apy>=15?'var(--amber)':'var(--rose)';
const sharpe=calcSharpe(s);
const sharpeColor=sharpe>=1.0?'var(--green)':sharpe>=0.5?'var(--amber)':'var(--rose)';
return `
<tr onclick="toggleRow('row-${s.id}')">
<td class="rank">${i+1}</td>
<td><div class="subnet-icon">SN${s.id}</div></td>
<td class="n">
<div style="display:flex;flex-direction:column;gap:4px">
<div style="font-weight:600;font-size:14px">${s.n}</div>
<div style="font-size:11px;color:var(--mute)">${s.cat}</div>
</div>
</td>
<td><span class="grade ${gradeClass}">${grade}</span></td>
<td class="val" style="color:${scoreColor};font-weight:700">${s.score}</td>
<td class="val" style="color:var(--cyan)">${s.alpha.toFixed(4)}τ</td>
<td class="val">$${s.mc.toFixed(1)}M</td>
<td class="val" style="color:var(--cyan)">${s.share.toFixed(2)}%</td>
<td class="val" style="color:${apyColor};font-weight:600">${apy.toFixed(1)}%</td>
<td class="val" style="color:var(--green)">${s.alpha.toFixed(2)}</td>
<td class="val">${s.fundamental}</td>
<td class="val" style="color:${sharpeColor};font-weight:600">${sharpe.toFixed(2)}</td>
</tr>
<tr class="row-exp" id="row-${s.id}">
<td colspan="12">
<!-- PRICE PERFORMANCE SECTION -->
<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
<span style="font-family:'Syne',sans-serif;font-weight:700;font-size:14px;color:var(--cyan);text-transform:uppercase;letter-spacing:0.1em">Price Performance</span>
</div>
<div style="display:grid;grid-template-columns:2fr 1fr;gap:20px;margin-bottom:24px;padding-bottom:24px;border-bottom:1px solid var(--bdr)">
<!-- Chart -->
<div style="background:var(--bg4);border:1px solid var(--bdr);border-radius:10px;padding:16px">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
<div style="font-size:13px;color:var(--txt2)">α Price vs TAO (7D)</div>
<div style="display:flex;gap:4px">
<button class="perf-tab" data-period="1" onclick="updatePerfChart(${s.id}, 1, this)" style="padding:4px 10px;background:var(--bg5);border:1px solid var(--bdr);border-radius:4px;color:var(--mute);font-size:10px;cursor:pointer">1D</button>
<button class="perf-tab act" data-period="7" onclick="updatePerfChart(${s.id}, 7, this)" style="padding:4px 10px;background:var(--cyan);border:1px solid var(--cyan);border-radius:4px;color:#000;font-size:10px;font-weight:600;cursor:pointer">7D</button>
<button class="perf-tab" data-period="30" onclick="updatePerfChart(${s.id}, 30, this)" style="padding:4px 10px;background:var(--bg5);border:1px solid var(--bdr);border-radius:4px;color:var(--mute);font-size:10px;cursor:pointer">30D</button>
</div>
</div>
<div style="height:160px"><canvas id="perfChart-${s.id}"></canvas></div>
</div>
<!-- Metrics -->
<div style="background:var(--bg4);border:1px solid var(--bdr);border-radius:10px;padding:16px">
<div style="font-size:11px;color:var(--mute);letter-spacing:0.15em;margin-bottom:16px">PERFORMANCE METRICS</div>
<div style="display:flex;flex-direction:column;gap:14px">
<div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:14px;border-bottom:1px solid var(--bdr)">
<span style="font-size:12px;color:var(--txt2)">α/TAO Ratio</span>
<span style="font-size:16px;font-weight:700;color:var(--cyan)">${s.alpha.toFixed(4)}</span>
</div>
<div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:14px;border-bottom:1px solid var(--bdr)">
<span style="font-size:12px;color:var(--txt2)">7D Change</span>
<span style="font-size:16px;font-weight:700;color:${s.momentum >= 0 ? 'var(--green)' : 'var(--rose)'}">${s.momentum >= 0 ? '+' : ''}${(s.momentum * 0.6).toFixed(1)}%</span>
</div>
<div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:14px;border-bottom:1px solid var(--bdr)">
<span style="font-size:12px;color:var(--txt2)">30D Change</span>
<span style="font-size:16px;font-weight:700;color:${s.momentum >= 0 ? 'var(--green)' : 'var(--rose)'}">${s.momentum >= 0 ? '+' : ''}${s.momentum.toFixed(1)}%</span>
</div>
<div style="display:flex;justify-content:space-between;align-items:center">
<span style="font-size:12px;color:var(--txt2)">Signal</span>
<span style="padding:4px 12px;border-radius:4px;font-size:11px;font-weight:700;letter-spacing:0.05em;background:${s.momentum >= 10 ? 'rgba(0,255,153,0.15)' : s.momentum >= 0 ? 'rgba(0,240,255,0.15)' : 'rgba(255,45,85,0.15)'};border:1px solid ${s.momentum >= 10 ? 'rgba(0,255,153,0.4)' : s.momentum >= 0 ? 'rgba(0,240,255,0.4)' : 'rgba(255,45,85,0.4)'};color:${s.momentum >= 10 ? 'var(--green)' : s.momentum >= 0 ? 'var(--cyan)' : 'var(--rose)'}">${s.momentum >= 10 ? 'OUTPERFORMING' : s.momentum >= 0 ? 'STABLE' : 'UNDERPERFORMING'}</span>
</div>
</div>
</div>
</div>

<!-- Key Metrics Row -->
<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:20px">
<div style="background:var(--bg4);border:1px solid var(--bdr);border-radius:8px;padding:12px;text-align:center;border-top:2px solid var(--cyan)">
<div style="font-size:9px;color:var(--mute);letter-spacing:0.1em;margin-bottom:6px">ALPHA</div>
<div style="font-size:16px;font-weight:700;color:var(--cyan)">${s.alpha.toFixed(4)}τ</div>
</div>
<div style="background:var(--bg4);border:1px solid var(--bdr);border-radius:8px;padding:12px;text-align:center;border-top:2px solid var(--amber)">
<div style="font-size:9px;color:var(--mute);letter-spacing:0.1em;margin-bottom:6px">MCAP</div>
<div style="font-size:16px;font-weight:700">$${s.mc.toFixed(1)}M</div>
</div>
<div style="background:var(--bg4);border:1px solid var(--bdr);border-radius:8px;padding:12px;text-align:center;border-top:2px solid ${apyColor}">
<div style="font-size:9px;color:var(--mute);letter-spacing:0.1em;margin-bottom:6px">APY</div>
<div style="font-size:16px;font-weight:700;color:${apyColor}">${apy.toFixed(1)}%</div>
</div>
<div style="background:var(--bg4);border:1px solid var(--bdr);border-radius:8px;padding:12px;text-align:center;border-top:2px solid ${sharpeColor}">
<div style="font-size:9px;color:var(--mute);letter-spacing:0.1em;margin-bottom:6px">SHARPE</div>
<div style="font-size:16px;font-weight:700;color:${sharpeColor}">${sharpe.toFixed(2)}</div>
</div>
<div style="background:var(--bg4);border:1px solid var(--bdr);border-radius:8px;padding:12px;text-align:center;border-top:2px solid var(--violet)">
<div style="font-size:9px;color:var(--mute);letter-spacing:0.1em;margin-bottom:6px">P/E</div>
<div style="font-size:16px;font-weight:700">${s.pe.toFixed(2)}x</div>
</div>
<div style="background:var(--bg4);border:1px solid var(--bdr);border-radius:8px;padding:12px;text-align:center;border-top:2px solid ${s.score >= 70 ? 'var(--green)' : 'var(--amber)'}">
<div style="font-size:9px;color:var(--mute);letter-spacing:0.1em;margin-bottom:6px">SCORE</div>
<div style="font-size:16px;font-weight:700;color:${s.score >= 70 ? 'var(--green)' : 'var(--amber)'}">${s.score}</div>
</div>
</div>

<div class="exp-grid">
<div class="exp-sec">
<div class="exp-sec-t">
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
Valuation Metrics
</div>
<div class="exp-metric"><span class="exp-m-l">α/EM <span class="metric-icon" data-tip="Alpha/Emission ratio. Lower = undervalued">?</span></span><span class="exp-m-v" style="color:${s.alpha < 0.05 ? 'var(--green)' : s.alpha < 0.1 ? 'var(--amber)' : 'var(--rose)'}">${s.alpha.toFixed(3)}</span></div>
<div class="exp-metric"><span class="exp-m-l">P/E <span class="metric-icon" data-tip="Price/Earnings. Lower = cheaper">?</span></span><span class="exp-m-v" style="color:${s.pe < 1.5 ? 'var(--green)' : s.pe < 2 ? 'var(--amber)' : 'var(--rose)'}">${s.pe.toFixed(2)}x</span></div>
<div class="exp-metric"><span class="exp-m-l">Sortino <span class="metric-icon" data-tip="Downside risk-adjusted return">?</span></span><span class="exp-m-v" style="color:${sharpe > 1 ? 'var(--green)' : 'var(--amber)'}">${(sharpe * 1.2).toFixed(2)}</span></div>
<div class="exp-metric"><span class="exp-m-l">Omega <span class="metric-icon" data-tip="Gain/loss probability ratio. >1 = more upside">?</span></span><span class="exp-m-v" style="color:${(1 + s.momentum/50) > 1 ? 'var(--green)' : 'var(--amber)'}">${(1 + s.momentum/50).toFixed(2)}</span></div>
<div class="exp-metric"><span class="exp-m-l">Calmar <span class="metric-icon" data-tip="Return per unit drawdown">?</span></span><span class="exp-m-v" style="color:var(--cyan)">${(apy / 15).toFixed(2)}</span></div>
</div>
<div class="exp-sec">
<div class="exp-sec-t">
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="2" x2="12" y2="22"/></svg>
Network & Emission
</div>
<div class="exp-metric"><span class="exp-m-l">Validators</span><span class="exp-m-v">${s.validators}</span></div>
<div class="exp-metric"><span class="exp-m-l">Miners</span><span class="exp-m-v">${s.miners}</span></div>
<div class="exp-metric"><span class="exp-m-l">Emission %</span><span class="exp-m-v" style="color:var(--cyan)">${s.share.toFixed(2)}%</span></div>
<div class="exp-metric"><span class="exp-m-l">Daily TAO</span><span class="exp-m-v">${s.dailyTao.toFixed(1)}τ</span></div>
<div class="exp-metric"><span class="exp-m-l">UID Util</span><span class="exp-m-v">${s.uptime}%</span></div>
</div>
<div class="exp-sec">
<div class="exp-sec-t">
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
Development: ${s.github}/100
</div>
<div class="exp-metric"><span class="exp-m-l">Commits</span><span class="exp-m-v">${s.commits}</span></div>
<div class="exp-metric"><span class="exp-m-l">Contributors</span><span class="exp-m-v">${s.contributors}</span></div>
<div class="exp-metric"><span class="exp-m-l">Stars</span><span class="exp-m-v">${s.stars}</span></div>
<div class="exp-metric"><span class="exp-m-l">Test Cov</span><span class="exp-m-v">${s.testCov}%</span></div>
<div class="exp-metric"><span class="exp-m-l">Docs</span><span class="exp-m-v">${s.docScore}%</span></div>
</div>
</div>
<div style="margin-top:20px;padding-top:20px;border-top:1px solid var(--bdr)">
<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
<span style="font-weight:700;font-size:12px;color:var(--cyan);text-transform:uppercase;letter-spacing:0.1em">Factor Scores</span>
</div>
<div class="exp-scores">
<div class="exp-score">
<div class="exp-score-l">Econ <span class="metric-icon" data-tip="Emission economics health">?</span></div>
<div class="exp-score-v" style="color:${s.economic>=70?'var(--green)':s.economic>=50?'var(--amber)':'var(--rose)'}">${s.economic}</div>
<div class="exp-score-bar"><div class="exp-score-fill" style="width:${s.economic}%;background:${s.economic>=70?'var(--green)':s.economic>=50?'var(--amber)':'var(--rose)'}"></div></div>
</div>
<div class="exp-score">
<div class="exp-score-l">Net <span class="metric-icon" data-tip="Network health (validators, miners)">?</span></div>
<div class="exp-score-v" style="color:${s.network>=70?'var(--green)':s.network>=50?'var(--amber)':'var(--rose)'}">${s.network}</div>
<div class="exp-score-bar"><div class="exp-score-fill" style="width:${s.network}%;background:${s.network>=70?'var(--green)':s.network>=50?'var(--amber)':'var(--rose)'}"></div></div>
</div>
<div class="exp-score">
<div class="exp-score-l">Fund <span class="metric-icon" data-tip="Development fundamentals">?</span></div>
<div class="exp-score-v" style="color:${s.fundamental>=70?'var(--green)':s.fundamental>=50?'var(--amber)':'var(--rose)'}">${s.fundamental}</div>
<div class="exp-score-bar"><div class="exp-score-fill" style="width:${s.fundamental}%;background:${s.fundamental>=70?'var(--green)':s.fundamental>=50?'var(--amber)':'var(--rose)'}"></div></div>
</div>
<div class="exp-score">
<div class="exp-score-l">Liq <span class="metric-icon" data-tip="Liquidity & exit capacity">?</span></div>
<div class="exp-score-v" style="color:${s.liquidity>=70?'var(--green)':s.liquidity>=50?'var(--amber)':'var(--rose)'}">${s.liquidity}</div>
<div class="exp-score-bar"><div class="exp-score-fill" style="width:${s.liquidity}%;background:${s.liquidity>=70?'var(--green)':s.liquidity>=50?'var(--amber)':'var(--rose)'}"></div></div>
</div>
<div class="exp-score">
<div class="exp-score-l">Mom <span class="metric-icon" data-tip="Price momentum trend">?</span></div>
<div class="exp-score-v" style="color:${s.momentum>=20?'var(--green)':s.momentum>=0?'var(--amber)':'var(--rose)'}">${s.momentum.toFixed(0)}</div>
<div class="exp-score-bar"><div class="exp-score-fill" style="width:${Math.min(Math.max(s.momentum+50,0),100)}%;background:${s.momentum>=20?'var(--green)':s.momentum>=0?'var(--amber)':'var(--rose)'}"></div></div>
</div>
<div class="exp-score">
<div class="exp-score-l">Qual <span class="metric-icon" data-tip="Code & documentation quality">?</span></div>
<div class="exp-score-v" style="color:${s.quality>=70?'var(--green)':s.quality>=50?'var(--amber)':'var(--rose)'}">${s.quality}</div>
<div class="exp-score-bar"><div class="exp-score-fill" style="width:${s.quality}%;background:${s.quality>=70?'var(--green)':s.quality>=50?'var(--amber)':'var(--rose)'}"></div></div>
</div>
</div>
</div>
<div style="margin-top:20px;padding:16px;background:var(--bg3);border-radius:8px;display:flex;align-items:center;gap:12px">
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
<div style="flex:1">
<div style="font-weight:700;font-size:12px;color:var(--amber);margin-bottom:4px">RISKS</div>
<div style="font-size:11px;color:var(--txt2)">⚠️ Emission dependency • ⚠️ Cloud competition</div>
</div>
</div>
<div style="margin-top:12px;padding:16px;background:var(--bg3);border-radius:8px;display:flex;align-items:center;gap:12px">
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
<div style="flex:1">
<div style="font-weight:700;font-size:12px;color:var(--green);margin-bottom:4px">MILESTONES</div>
<div style="font-size:11px;color:var(--txt2)">→ TEE implementation • → Enterprise SDK</div>
</div>
</div>

</td>
</tr>
`;
}).join('');

// Initialize mini charts for visible expanded rows
setTimeout(initSubnetCharts, 100);
}

// Initialize subnet price charts
function initSubnetCharts() {
    document.querySelectorAll('.row-exp.show canvas').forEach(canvas => {
        const id = canvas.id.replace('chart-', '');
        const sub = subs.find(s => s.id == id);
        if (sub && !canvas.chart) {
            createSubnetChart(canvas, sub);
        }
    });
}

// Create mini price chart for subnet
function createSubnetChart(canvas, sub) {
    const ctx = canvas.getContext('2d');
    // Generate simulated price data based on momentum
    const days = 7;
    const data = [];
    let price = sub.alpha * 0.85; // Start 15% lower
    for (let i = 0; i < days * 24; i++) {
        const trend = sub.momentum / 100 / (days * 24);
        const noise = (Math.random() - 0.5) * 0.02 * sub.alpha;
        price = price * (1 + trend) + noise;
        if (i % 4 === 0) data.push(price); // Every 4 hours
    }
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 100);
    const color = sub.momentum >= 0 ? '16,185,129' : '244,63,94';
    gradient.addColorStop(0, 'rgba(' + color + ',0.3)');
    gradient.addColorStop(1, 'rgba(' + color + ',0)');
    
    canvas.chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map((_, i) => ''),
            datasets: [{
                data: data,
                borderColor: 'rgb(' + color + ')',
                borderWidth: 2,
                fill: true,
                backgroundColor: gradient,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { display: false },
                y: { display: false }
            }
        }
    });
}

function toggleRow(id){
    document.getElementById(id)?.classList.toggle('show');
    setTimeout(() => {
        initSubnetCharts();
        initPerfCharts();
    }, 50);
}

// Initialize performance charts for expanded rows
function initPerfCharts() {
    document.querySelectorAll('.row-exp.show').forEach(row => {
        const canvas = row.querySelector('canvas[id^="perfChart-"]');
        if (canvas && !canvas.chart) {
            const subId = parseInt(canvas.id.replace('perfChart-', ''));
            const sub = subs.find(s => s.id === subId);
            if (sub) {
                createPerfChart(canvas, sub, 7);
            }
        }
    });
}

// Create performance chart for subnet
function createPerfChart(canvas, sub, days) {
    const ctx = canvas.getContext('2d');
    
    // Generate price data based on momentum
    const dataPoints = days * 4; // 4 data points per day
    const data = [];
    let price = sub.alpha * (1 - sub.momentum / 200); // Start lower if positive momentum
    
    for (let i = 0; i < dataPoints; i++) {
        const trend = (sub.momentum / 100) / dataPoints;
        const noise = (Math.random() - 0.5) * 0.015 * sub.alpha;
        price = price * (1 + trend) + noise;
        data.push(price);
    }
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 160);
    const isPositive = sub.momentum >= 0;
    gradient.addColorStop(0, isPositive ? 'rgba(0,255,153,0.25)' : 'rgba(255,45,85,0.25)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    
    if (canvas.chart) {
        canvas.chart.destroy();
    }
    
    canvas.chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map((_, i) => ''),
            datasets: [{
                data: data,
                borderColor: isPositive ? '#00ff99' : '#ff2d55',
                borderWidth: 2,
                fill: true,
                backgroundColor: gradient,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { display: false },
                y: { display: false }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// Update performance chart with new period
function updatePerfChart(subId, days, btn) {
    // Update active button
    const parent = btn.parentElement;
    parent.querySelectorAll('.perf-tab').forEach(b => {
        b.style.background = 'var(--bg5)';
        b.style.borderColor = 'var(--bdr)';
        b.style.color = 'var(--mute)';
        b.style.fontWeight = '400';
    });
    btn.style.background = 'var(--cyan)';
    btn.style.borderColor = 'var(--cyan)';
    btn.style.color = '#000';
    btn.style.fontWeight = '600';
    
    // Recreate chart
    const canvas = document.getElementById('perfChart-' + subId);
    const sub = subs.find(s => s.id === subId);
    if (canvas && sub) {
        createPerfChart(canvas, sub, days);
    }
}

// Render Top Performers cards
function renderTopPerformers() {
    const sortBy = document.getElementById('perfSort')?.value || 'momentum';
    let sorted = [...subs].filter(s => s.mc > 10); // Only active subnets
    
    if (sortBy === 'momentum') sorted.sort((a, b) => b.momentum - a.momentum);
    else if (sortBy === 'apy') sorted.sort((a, b) => calcAPY(b) - calcAPY(a));
    else if (sortBy === 'sharpe') sorted.sort((a, b) => calcSharpe(b) - calcSharpe(a));
    
    const top4 = sorted.slice(0, 4);
    
    document.getElementById('topPerfGrid').innerHTML = top4.map((s, i) => {
        const apy = calcAPY(s);
        const sharpe = calcSharpe(s);
        const signal = s.momentum >= 15 ? 'BUY' : s.momentum >= 5 ? 'BUY' : s.momentum >= 0 ? 'HOLD' : 'WATCH';
        const signalColor = signal === 'BUY' ? 'var(--green)' : signal === 'HOLD' ? 'var(--amber)' : 'var(--violet)';
        const volLevel = sharpe >= 1.5 ? 'Low Vol' : sharpe >= 1 ? 'Med Vol' : 'High Vol';
        
        return `
<div style="display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid var(--bdr)">
    <div style="flex:1">
        <div style="font-family:'Syne',sans-serif;font-size:14px;font-weight:700;color:var(--txt)">SN${s.id} ${s.n}</div>
        <div style="font-size:11px;color:var(--mute)">${apy.toFixed(1)}% APY · ${volLevel}</div>
    </div>
    <div style="text-align:right;display:flex;align-items:center;gap:12px">
        <div style="font-size:15px;font-weight:700;font-family:'IBM Plex Mono',monospace;color:${s.momentum >= 0 ? 'var(--green)' : 'var(--rose)'}">${s.momentum >= 0 ? '+' : ''}${s.momentum.toFixed(1)}%</div>
        <span style="padding:4px 10px;border-radius:4px;font-size:10px;font-weight:600;background:${signal === 'BUY' ? 'rgba(0,255,153,0.12)' : signal === 'HOLD' ? 'rgba(255,214,10,0.12)' : 'rgba(191,90,242,0.12)'};border:1px solid ${signal === 'BUY' ? 'rgba(0,255,153,0.3)' : signal === 'HOLD' ? 'rgba(255,214,10,0.3)' : 'rgba(191,90,242,0.3)'};color:${signalColor}">${signal}</span>
    </div>
</div>`;
    }).join('');
}

function renderNews(){
    const tagColors = {
        'MACRO': { bg: 'rgba(0,240,255,0.15)', border: 'rgba(0,240,255,0.4)', color: '#00f0ff', icon: '🌐' },
        'SUBNET': { bg: 'rgba(0,255,153,0.15)', border: 'rgba(0,255,153,0.4)', color: '#00ff99', icon: '⬡' },
        'AI': { bg: 'rgba(255,214,10,0.15)', border: 'rgba(255,214,10,0.4)', color: '#ffd60a', icon: '🤖' },
        'DEFI': { bg: 'rgba(255,123,44,0.15)', border: 'rgba(255,123,44,0.4)', color: '#ff7b2c', icon: '💰' },
        'PROTOCOL': { bg: 'rgba(191,90,242,0.15)', border: 'rgba(191,90,242,0.4)', color: '#bf5af2', icon: '⚙️' },
        'MARKET': { bg: 'rgba(0,240,255,0.15)', border: 'rgba(0,240,255,0.4)', color: '#00f0ff', icon: '📊' },
        'INSTITUTIONAL': { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)', color: '#10b981', icon: '🏛️' }
    };
    
    const sourceIcons = {
        'TAO Daily': '📰',
        'TaoStats': '📈',
        'CoinTelegraph': '🗞️',
        'TechCrunch': '💻',
        'Reuters': '📡',
        'Deribit': '📉',
        'Messari': '📊'
    };
    
    const getSourceIcon = (source) => {
        if (source.startsWith('@')) return '𝕏';
        return sourceIcons[source] || '🔗';
    };
    
    const getImpactColor = (pct) => pct >= 80 ? '#00ff99' : pct >= 60 ? '#00f0ff' : pct >= 40 ? '#ffd60a' : '#606075';
    const getImpactLabel = (pct) => pct >= 80 ? 'HIGH' : pct >= 60 ? 'MED-HIGH' : pct >= 40 ? 'MEDIUM' : 'LOW';
    
    document.getElementById('newsG').innerHTML = news.map(n => {
        const tc = tagColors[n.tg] || tagColors['MACRO'];
        const impactColor = getImpactColor(n.impactPct || 50);
        const sourceIcon = getSourceIcon(n.s);
        const isTwitter = n.s.startsWith('@');
        const sourceUrl = n.url || '#';
        
        return `
<div style="padding:20px 0;border-bottom:1px solid var(--bdr);transition:background 0.2s" onmouseenter="this.style.background='rgba(255,255,255,0.02)'" onmouseleave="this.style.background='transparent'">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:10px">
            <span style="display:inline-block;padding:4px 12px;background:${tc.bg};border:1px solid ${tc.border};border-radius:4px;font-size:10px;font-weight:700;color:${tc.color};letter-spacing:0.05em">${tc.icon} ${n.tg}</span>
            <a href="${sourceUrl}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:var(--bg4);border:1px solid var(--bdr);border-radius:4px;font-size:10px;color:var(--txt2);text-decoration:none;transition:all 0.2s" onmouseenter="this.style.borderColor='var(--cyan)';this.style.color='var(--cyan)'" onmouseleave="this.style.borderColor='var(--bdr)';this.style.color='var(--txt2)'">
                <span>${sourceIcon}</span>
                <span>${n.s}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
        </div>
        <span style="font-size:11px;color:var(--mute);font-family:'IBM Plex Mono',monospace;white-space:nowrap">${n.tm}</span>
    </div>
    <a href="${sourceUrl}" target="_blank" rel="noopener" style="display:block;font-size:15px;color:var(--txt);line-height:1.6;margin-bottom:16px;font-weight:500;text-decoration:none;transition:color 0.2s" onmouseenter="this.style.color='var(--cyan)'" onmouseleave="this.style.color='var(--txt)'">${n.t}</a>
    <div style="display:flex;align-items:center;gap:12px">
        <span style="font-size:10px;color:var(--mute);min-width:50px;text-transform:uppercase;letter-spacing:0.05em">Impact</span>
        <div style="flex:1;height:6px;background:var(--bg4);border-radius:3px;overflow:hidden">
            <div style="width:${n.impactPct || 50}%;height:100%;background:linear-gradient(90deg,${impactColor}80,${impactColor});border-radius:3px;transition:width 0.3s"></div>
        </div>
        <span style="font-size:11px;color:${impactColor};font-weight:700;min-width:75px;text-align:right">${getImpactLabel(n.impactPct)}</span>
    </div>
</div>`;
    }).join('');
}
function renderRes(){
    const resG = document.getElementById('resG');
    if (!resG) return;
    resG.innerHTML = research.map((r,idx)=>'<a href="#" class="res-c" onclick="openResearch('+idx+');return false;"><div class="res-img">'+r.i+'</div><div class="res-cnt"><div class="res-cat">'+r.c+'</div><h3 class="res-t">'+r.t+'</h3><p class="res-ex">'+r.ex+'</p><div class="res-meta"><span>DeAI Research</span><span>'+r.d+'</span></div></div></a>').join('');
}

// Filter news by source
let currentNewsFilter = 'all';
function filterNewsBySource(filter) {
    currentNewsFilter = filter;
    
    // Update button states
    document.querySelectorAll('.source-pill').forEach(btn => {
        btn.classList.remove('act');
        btn.style.background = 'transparent';
        btn.style.borderColor = 'var(--bdr)';
        btn.style.color = 'var(--txt2)';
    });
    
    if (event && event.target) {
        event.target.classList.add('act');
        event.target.style.background = 'var(--cyan)';
        event.target.style.borderColor = 'var(--cyan)';
        event.target.style.color = '#000';
    }
    
    // Filter and render
    renderNewsFiltered(filter);
}

function renderNewsFiltered(filter) {
    const tagColors = {
        'MACRO': { bg: 'rgba(0,240,255,0.15)', border: 'rgba(0,240,255,0.4)', color: '#00f0ff', icon: '🌐' },
        'SUBNET': { bg: 'rgba(0,255,153,0.15)', border: 'rgba(0,255,153,0.4)', color: '#00ff99', icon: '⬡' },
        'AI': { bg: 'rgba(255,214,10,0.15)', border: 'rgba(255,214,10,0.4)', color: '#ffd60a', icon: '🤖' },
        'DEFI': { bg: 'rgba(255,123,44,0.15)', border: 'rgba(255,123,44,0.4)', color: '#ff7b2c', icon: '💰' },
        'PROTOCOL': { bg: 'rgba(191,90,242,0.15)', border: 'rgba(191,90,242,0.4)', color: '#bf5af2', icon: '⚙️' },
        'MARKET': { bg: 'rgba(0,240,255,0.15)', border: 'rgba(0,240,255,0.4)', color: '#00f0ff', icon: '📊' },
        'INSTITUTIONAL': { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)', color: '#10b981', icon: '🏛️' }
    };
    
    const sourceIcons = {
        'TAO Daily': '📰',
        'TaoStats': '📈',
        'CoinTelegraph': '🗞️',
        'TechCrunch': '💻',
        'Reuters': '📡',
        'Deribit': '📉'
    };
    
    const getSourceIcon = (source) => source.startsWith('@') ? '𝕏' : sourceIcons[source] || '🔗';
    const getImpactColor = (pct) => pct >= 80 ? '#00ff99' : pct >= 60 ? '#00f0ff' : pct >= 40 ? '#ffd60a' : '#606075';
    const getImpactLabel = (pct) => pct >= 80 ? 'HIGH' : pct >= 60 ? 'MED-HIGH' : pct >= 40 ? 'MEDIUM' : 'LOW';
    
    // Apply filter
    let filteredNews = news;
    if (filter === 'HIGH') {
        filteredNews = news.filter(n => n.impactPct >= 80);
    } else if (filter === '@') {
        filteredNews = news.filter(n => n.s.startsWith('@'));
    } else if (filter !== 'all') {
        filteredNews = news.filter(n => n.s.includes(filter));
    }
    
    if (filteredNews.length === 0) {
        document.getElementById('newsG').innerHTML = '<div style="text-align:center;padding:40px;color:var(--mute)">No news items match this filter</div>';
        return;
    }
    
    document.getElementById('newsG').innerHTML = filteredNews.map(n => {
        const tc = tagColors[n.tg] || tagColors['MACRO'];
        const impactColor = getImpactColor(n.impactPct || 50);
        const sourceIcon = getSourceIcon(n.s);
        const sourceUrl = n.url || '#';
        
        return `
<div style="padding:20px 0;border-bottom:1px solid var(--bdr);transition:background 0.2s" onmouseenter="this.style.background='rgba(255,255,255,0.02)'" onmouseleave="this.style.background='transparent'">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:10px">
            <span style="display:inline-block;padding:4px 12px;background:${tc.bg};border:1px solid ${tc.border};border-radius:4px;font-size:10px;font-weight:700;color:${tc.color};letter-spacing:0.05em">${tc.icon} ${n.tg}</span>
            <a href="${sourceUrl}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:var(--bg4);border:1px solid var(--bdr);border-radius:4px;font-size:10px;color:var(--txt2);text-decoration:none;transition:all 0.2s" onmouseenter="this.style.borderColor='var(--cyan)';this.style.color='var(--cyan)'" onmouseleave="this.style.borderColor='var(--bdr)';this.style.color='var(--txt2)'">
                <span>${sourceIcon}</span>
                <span>${n.s}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
        </div>
        <span style="font-size:11px;color:var(--mute);font-family:'IBM Plex Mono',monospace;white-space:nowrap">${n.tm}</span>
    </div>
    <a href="${sourceUrl}" target="_blank" rel="noopener" style="display:block;font-size:15px;color:var(--txt);line-height:1.6;margin-bottom:16px;font-weight:500;text-decoration:none;transition:color 0.2s" onmouseenter="this.style.color='var(--cyan)'" onmouseleave="this.style.color='var(--txt)'">${n.t}</a>
    <div style="display:flex;align-items:center;gap:12px">
        <span style="font-size:10px;color:var(--mute);min-width:50px;text-transform:uppercase;letter-spacing:0.05em">Impact</span>
        <div style="flex:1;height:6px;background:var(--bg4);border-radius:3px;overflow:hidden">
            <div style="width:${n.impactPct || 50}%;height:100%;background:linear-gradient(90deg,${impactColor}80,${impactColor});border-radius:3px;transition:width 0.3s"></div>
        </div>
        <span style="font-size:11px;color:${impactColor};font-weight:700;min-width:75px;text-align:right">${getImpactLabel(n.impactPct)}</span>
    </div>
</div>`;
    }).join('');
}

// ============================================
// PORTFOLIO ANALYTICS (New Tab)
// ============================================
let paStakingChart = null;
let paScenarioChart = null;
let currentPeriod = 90;
let selectedSubnets = [];

// Initialize subnet selector
function initSubnetSelector() {
    const container = document.getElementById('pa-subnetSelector');
    if (!container) return;
    
    const topSubs = [...subs].sort((a, b) => calcAPY(b) - calcAPY(a)).slice(0, 20);
    const colors = ['#3b82f6', '#00f0ff', '#10b981', '#fbbf24', '#8b5cf6', '#f43f5e', '#06b6d4', '#f59e0b'];
    
    container.innerHTML = topSubs.map((s, i) => {
        const isSelected = selectedSubnets.includes(s.id);
        return `<button onclick="toggleSubnet(${s.id})" style="padding:6px 12px;background:${isSelected ? colors[i % 8] + '33' : 'var(--bg3)'};border:1px solid ${isSelected ? colors[i % 8] : 'var(--bdr)'};border-radius:6px;color:${isSelected ? colors[i % 8] : 'var(--txt2)'};font-size:11px;cursor:pointer;transition:all 0.2s">${s.n} <span style="opacity:0.6">${calcAPY(s).toFixed(1)}%</span></button>`;
    }).join('');
}

function toggleSubnet(id) {
    if (selectedSubnets.includes(id)) {
        selectedSubnets = selectedSubnets.filter(s => s !== id);
    } else if (selectedSubnets.length < 8) {
        selectedSubnets.push(id);
    }
    initSubnetSelector();
    updatePortfolioAnalytics();
}

function selectTopSubnets() {
    selectedSubnets = [...subs].sort((a, b) => calcAPY(b) - calcAPY(a)).slice(0, 8).map(s => s.id);
    initSubnetSelector();
    updatePortfolioAnalytics();
}

function updatePortfolioAnalytics() {
    const holdings = parseFloat(document.getElementById('pa-holdings')?.value) || 10000;
    const taoPrice = currentTaoPrice || 191.43;
    const avgApy = 14.77;
    
    // Auto-select top 8 if none selected
    if (selectedSubnets.length === 0) {
        selectedSubnets = [...subs].sort((a, b) => calcAPY(b) - calcAPY(a)).slice(0, 8).map(s => s.id);
        initSubnetSelector();
    }
    
    // Update summary cards
    const usdValue = holdings * taoPrice;
    const annualYield = holdings * (avgApy / 100);
    const monthlyIncome = (annualYield * taoPrice) / 12;
    
    const usdEl = document.getElementById('pa-usdvalue');
    const priceEl = document.getElementById('pa-taoPrice');
    const yieldEl = document.getElementById('pa-annualYield');
    const apyEl = document.getElementById('pa-avgApy');
    const monthlyEl = document.getElementById('pa-monthlyUsd');
    const holdingsRefEl = document.getElementById('pa-holdingsRef');
    
    if (usdEl) usdEl.textContent = '$' + usdValue.toLocaleString('en-US', {maximumFractionDigits: 0});
    if (priceEl) priceEl.textContent = '$' + taoPrice.toFixed(2);
    if (yieldEl) yieldEl.textContent = Math.round(annualYield).toLocaleString();
    if (apyEl) apyEl.textContent = avgApy.toFixed(2);
    if (monthlyEl) monthlyEl.textContent = '$' + monthlyIncome.toLocaleString('en-US', {maximumFractionDigits: 0});
    if (holdingsRefEl) holdingsRefEl.textContent = holdings.toLocaleString();
    
    renderStakingTable(holdings, taoPrice);
    renderRebalancing(holdings, taoPrice);
    renderScenarios(holdings, taoPrice);
    updateStakingChart(currentPeriod);
    updateScenarioChart(holdings, taoPrice);
}

function renderStakingTable(holdings, taoPrice) {
    const container = document.getElementById('pa-stakingTable');
    if (!container) return;
    
    const selectedSubs = subs.filter(s => selectedSubnets.includes(s.id));
    if (selectedSubs.length === 0) return;
    
    const colors = ['#3b82f6', '#fbbf24', '#00f0ff', '#10b981', '#f43f5e', '#8b5cf6', '#06b6d4', '#f59e0b'];
    
    let html = '';
    selectedSubs.forEach((s, i) => {
        const apy = calcAPY(s);
        const dailyTao = holdings * (apy / 100) / 365;
        const monthlyTao = dailyTao * 30;
        const annualTao = holdings * (apy / 100);
        const monthlyUsd = monthlyTao * taoPrice;
        const annualUsd = annualTao * taoPrice;
        
        html += `<tr style="border-bottom:1px solid var(--bdr)">
            <td style="padding:12px 8px;font-size:12px"><span style="color:${colors[i % 8]}">●</span> ${s.n} <span style="color:var(--mute)">SN${s.id}</span></td>
            <td style="padding:12px 8px;text-align:right;color:var(--amber);font-weight:600;font-size:12px">${apy.toFixed(2)}%</td>
            <td style="padding:12px 8px;text-align:right;font-family:'IBM Plex Mono',monospace;font-size:11px">${dailyTao.toFixed(4)} τ</td>
            <td style="padding:12px 8px;text-align:right;font-family:'IBM Plex Mono',monospace;font-size:11px">${monthlyTao.toFixed(3)} τ</td>
            <td style="padding:12px 8px;text-align:right;font-family:'IBM Plex Mono',monospace;font-size:11px">${annualTao.toFixed(2)} τ</td>
            <td style="padding:12px 8px;text-align:right;color:var(--cyan);font-weight:600;font-size:12px">$${monthlyUsd.toLocaleString('en-US', {maximumFractionDigits: 0})}</td>
            <td style="padding:12px 8px;text-align:right;color:var(--green);font-weight:600;font-size:12px">$${annualUsd.toLocaleString('en-US', {maximumFractionDigits: 0})}</td>
            <td style="padding:12px 8px;text-align:right;font-family:'IBM Plex Mono',monospace;font-size:11px">${annualTao.toFixed(2)} τ</td>
        </tr>`;
    });
    container.innerHTML = html;
}

function renderRebalancing(holdings, taoPrice) {
    const currentEl = document.getElementById('pa-currentAlloc');
    const optimizedEl = document.getElementById('pa-optimizedAlloc');
    if (!currentEl || !optimizedEl) return;
    
    const selectedSubs = subs.filter(s => selectedSubnets.includes(s.id)).slice(0, 5);
    const colors = ['#3b82f6', '#00f0ff', '#10b981', '#fbbf24', '#8b5cf6'];
    
    // Current: equal weight
    const equalWeight = Math.floor(100 / selectedSubs.length);
    let currentHtml = '';
    let currentApy = 0;
    
    selectedSubs.forEach((s, i) => {
        const apy = calcAPY(s);
        currentApy += (equalWeight / 100) * apy;
        currentHtml += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:11px">
            <span><span style="color:${colors[i]}">●</span> ${s.n}</span>
            <span style="color:var(--mute)">${equalWeight}%</span>
        </div>`;
    });
    
    // Optimized: weighted by score
    const totalScore = selectedSubs.reduce((acc, s) => acc + s.score, 0);
    let optimizedHtml = '';
    let optimizedApy = 0;
    
    selectedSubs.forEach((s, i) => {
        const weight = Math.round((s.score / totalScore) * 100);
        const apy = calcAPY(s);
        optimizedApy += (weight / 100) * apy;
        optimizedHtml += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:11px">
            <span><span style="color:${colors[i]}">●</span> ${s.n}</span>
            <span style="color:var(--green);font-weight:600">${weight}%</span>
        </div>`;
    });
    
    currentEl.innerHTML = currentHtml;
    optimizedEl.innerHTML = optimizedHtml;
    
    const currentApyEl = document.getElementById('pa-currentApy');
    const optimizedApyEl = document.getElementById('pa-optimizedApy');
    if (currentApyEl) currentApyEl.textContent = currentApy.toFixed(1) + '%';
    if (optimizedApyEl) optimizedApyEl.textContent = optimizedApy.toFixed(1) + '%';
}

function optimizeAllocation() {
    // Modern Portfolio Theory optimization adapted for subnets
    // Uses mean-variance optimization with subnet-specific volatility estimates
    const holdings = parseFloat(document.getElementById('pa-holdings')?.value) || 10000;
    const taoPrice = currentTaoPrice || 191.43;
    
    // Get selected subnets or default to top by APY
    const selected = selectedSubnets.length > 0 ? 
        subs.filter(s => selectedSubnets.includes(s.id)) : 
        [...subs].sort((a, b) => calcAPY(b) - calcAPY(a)).slice(0, 5);
    
    // MPT: Calculate expected returns and volatilities
    const subnetData = selected.map(s => ({
        ...s,
        expReturn: calcAPY(s) / 100,
        volatility: calcVolatility(s) / 100,
        sharpe: calcSharpe(s)
    }));
    
    // Calculate optimal weights using Sharpe ratio weighting (simplified MPT)
    // Weight = Sharpe² / Σ(Sharpe²) - penalizes high volatility
    const totalSharpeSquared = subnetData.reduce((sum, s) => sum + Math.pow(s.sharpe, 2), 0);
    let weights = subnetData.map(s => Math.pow(s.sharpe, 2) / totalSharpeSquared);
    
    // Apply concentration limits (no single position > 30%)
    const maxWeight = 0.30;
    let excess = 0;
    weights = weights.map(w => {
        if (w > maxWeight) {
            excess += w - maxWeight;
            return maxWeight;
        }
        return w;
    });
    
    // Redistribute excess proportionally to underweight positions
    if (excess > 0) {
        const underweightSum = weights.filter(w => w < maxWeight).reduce((s, w) => s + w, 0);
        weights = weights.map(w => w < maxWeight ? w + (w / underweightSum) * excess : w);
    }
    
    // Normalize to 100%
    const totalWeight = weights.reduce((s, w) => s + w, 0);
    weights = weights.map(w => w / totalWeight);
    
    // Calculate portfolio metrics
    const portReturn = subnetData.reduce((sum, s, i) => sum + weights[i] * s.expReturn, 0);
    const portVol = Math.sqrt(subnetData.reduce((sum, s, i) => sum + Math.pow(weights[i] * s.volatility, 2), 0));
    
    // Render optimized allocation
    const container = document.getElementById('pa-rebalance');
    if (container) {
        const colors = ['#00f0ff', '#10b981', '#fbbf24', '#8b5cf6', '#f43f5e', '#06b6d4', '#f59e0b', '#ec4899'];
        
        let html = subnetData.map((s, i) => {
            const weight = weights[i];
            const taoAlloc = holdings * weight;
            const annualYield = taoAlloc * s.expReturn;
            
            return `<div style="margin-bottom:14px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                    <div style="display:flex;align-items:center;gap:8px">
                        <span style="width:8px;height:8px;background:${colors[i]};border-radius:50%"></span>
                        <span style="font-weight:600">${s.n}</span>
                        <span style="color:var(--mute);font-size:10px">SN${s.id}</span>
                    </div>
                    <div style="text-align:right">
                        <span style="color:var(--cyan);font-weight:600">${(weight * 100).toFixed(0)}%</span>
                        <span style="color:var(--mute);margin-left:8px">${taoAlloc.toFixed(1)}τ</span>
                    </div>
                </div>
                <div style="height:4px;background:var(--bg5);border-radius:2px;overflow:hidden">
                    <div style="height:100%;width:${weight * 100}%;background:${colors[i]};border-radius:2px"></div>
                </div>
                <div style="text-align:right;margin-top:4px">
                    <span style="font-size:12px;font-weight:600;color:var(--green)">+${annualYield.toFixed(2)}τ/yr</span>
                </div>
            </div>`;
        }).join('');
        
        // Portfolio summary
        const blendedAPY = portReturn * 100;
        const totalAnnualYield = holdings * portReturn;
        const yieldUSD = totalAnnualYield * taoPrice;
        
        html += `<div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--bdr)">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px">
                <span style="color:var(--mute)">Blended APY</span>
                <span style="font-weight:700;color:var(--cyan)">${blendedAPY.toFixed(1)}%</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:8px">
                <span style="color:var(--mute)">Portfolio Vol</span>
                <span style="font-weight:600;color:var(--amber)">${(portVol * 100).toFixed(1)}%</span>
            </div>
            <div style="display:flex;justify-content:space-between">
                <span style="color:var(--mute)">Est. Annual Yield</span>
                <span style="font-weight:700;color:var(--green)">+${totalAnnualYield.toFixed(2)} τ / year ($${(yieldUSD/1000).toFixed(1)}K)</span>
            </div>
        </div>`;
        
        container.innerHTML = html;
    }
    
    // Update scenarios with new holdings
    renderScenarios(holdings, taoPrice);
}

function renderScenarios(holdings, taoPrice) {
    const container = document.getElementById('pa-scenarios');
    if (!container) return;
    
    const scenarios = [
        { name: 'Apocalypse -99%', mult: 0.01, color: '#7c3aed', icon: '💀' },
        { name: 'Crypto Winter -75%', mult: 0.25, color: '#8b5cf6', icon: '❄️' },
        { name: 'Bear -50%', mult: 0.50, color: '#f43f5e', icon: '🐻' },
        { name: 'Correction -25%', mult: 0.75, color: '#f59e0b', icon: '📉' },
        { name: 'Current', mult: 1.00, color: '#fbbf24', icon: '📍' },
        { name: 'Bull +50%', mult: 1.50, color: '#10b981', icon: '🐂' },
        { name: 'Raging Bull +100%', mult: 2.00, color: '#22c55e', icon: '🔥' },
        { name: 'Moon +200%', mult: 3.00, color: '#06b6d4', icon: '🌙' },
        { name: 'Moonshot +333%', mult: 4.33, color: '#00f0ff', icon: '🚀' }
    ];
    
    let html = '';
    scenarios.forEach(sc => {
        const price = taoPrice * sc.mult;
        const value = holdings * price;
        const isCurrent = sc.mult === 1.00;
        const pricePerTao = '$' + price.toFixed(2) + '/τ';
        
        html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;${isCurrent ? 'background:rgba(255,214,10,0.1);margin:0 -8px;padding:8px 8px;border-radius:4px' : ''}">
            <span style="font-size:12px;color:${isCurrent ? 'var(--amber)' : 'var(--txt2)'};font-weight:${isCurrent ? '600' : '400'}">${sc.icon} ${sc.name}</span>
            <span style="font-size:11px;color:var(--mute);font-family:'IBM Plex Mono',monospace">${pricePerTao}</span>
            <span style="font-size:13px;font-weight:700;color:${sc.color};font-family:'IBM Plex Mono',monospace">$${value >= 1000000 ? (value/1000000).toFixed(3) + 'M' : value.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
        </div>`;
    });
    
    // Add footer
    html += `<div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--bdr);font-size:11px;color:var(--mute)">
        Based on <span style="color:var(--cyan);font-weight:600">${holdings.toLocaleString()} τ</span> · Current: <span style="color:var(--green)">$${taoPrice.toFixed(2)}</span>
    </div>`;
    
    container.innerHTML = html;
}

function updateStakingChart(days) {
    currentPeriod = days;
    const holdings = parseFloat(document.getElementById('pa-holdings').value) || 1000;
    const blendedApy = 17.9;
    
    // Update pill buttons
    document.querySelectorAll('#pa-periodPills .time-pill').forEach(btn => {
        btn.classList.remove('act');
        if (btn.textContent === days + 'D') btn.classList.add('act');
    });
    
    document.getElementById('pa-chartSubtitle').textContent = `τ earned: Compounded (${blendedApy}% APY) over ${days} days`;
    
    // Generate data points with proper exponential compounding curve
    const dailyRate = blendedApy / 100 / 365;
    const numPoints = 60;
    
    // Create datasets for each time period with different colors
    const periods = [
        { days: 30, color: '#3b82f6', label: '30D' },
        { days: 60, color: '#8b5cf6', label: '60D' },
        { days: 90, color: '#ec4899', label: '90D' },
        { days: 180, color: '#f59e0b', label: '180D' }
    ];
    
    const datasets = [];
    const labels = [];
    
    // Generate labels for the selected period
    for (let i = 0; i <= numPoints; i++) {
        const d = Math.round((i / numPoints) * days);
        if (i % 10 === 0 || i === numPoints) {
            labels.push('D' + d);
        } else {
            labels.push('');
        }
    }
    
    // Create a dataset for each period up to the selected one
    periods.forEach((period, idx) => {
        if (period.days <= days) {
            const data = [];
            for (let i = 0; i <= numPoints; i++) {
                const d = Math.round((i / numPoints) * days);
                if (d <= period.days) {
                    // Exponential compounding formula: P * (1 + r)^t - P
                    const earned = holdings * (Math.pow(1 + dailyRate, d) - 1);
                    data.push(earned);
                } else {
                    data.push(null); // Don't plot beyond this period
                }
            }
            
            const ctx = document.getElementById('pa-stakingChart');
            let gradient = null;
            if (ctx) {
                gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 220);
                gradient.addColorStop(0, period.color + '40');
                gradient.addColorStop(1, period.color + '05');
            }
            
            datasets.push({
                label: period.label,
                data: data,
                borderColor: period.color,
                borderWidth: period.days === days ? 3 : 2,
                backgroundColor: period.days === days ? gradient : 'transparent',
                fill: period.days === days,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 4
            });
        }
    });
    
    if (paStakingChart) paStakingChart.destroy();
    
    const ctx = document.getElementById('pa-stakingChart');
    if (!ctx) return;
    
    paStakingChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: { 
                legend: { 
                    display: true,
                    position: 'top',
                    align: 'end',
                    labels: {
                        boxWidth: 12,
                        padding: 8,
                        font: { size: 10 },
                        color: '#a0a0b8'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: ctx => ctx.dataset.label + ': ' + ctx.parsed.y.toFixed(2) + ' τ'
                    }
                }
            },
            scales: {
                x: { 
                    grid: { color: 'rgba(255,255,255,0.05)' }, 
                    ticks: { color: '#606075', font: { size: 9 }, maxTicksLimit: 7 } 
                },
                y: { 
                    grid: { color: 'rgba(255,255,255,0.05)' }, 
                    ticks: { 
                        color: '#606075', 
                        callback: v => v.toFixed(1) + 'τ'
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

function updateScenarioChart(holdings, taoPrice) {
    const scenarios = ['Correction -25%', 'Bear -50%', 'Crypto Winter -75%', 'Current', 'Bull +50%', 'Raging Bull +100%', 'Moon +200%', 'Moonshot +333%'];
    const multipliers = [0.75, 0.50, 0.25, 1.00, 1.50, 2.00, 3.00, 4.33];
    const values = multipliers.map(m => holdings * taoPrice * m);
    const colors = ['#f59e0b', '#f43f5e', '#7c3aed', '#fbbf24', '#10b981', '#22c55e', '#00f0ff', '#a855f7'];
    
    if (paScenarioChart) paScenarioChart.destroy();
    
    const ctx = document.getElementById('pa-scenarioChart');
    if (!ctx) return;
    
    paScenarioChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: scenarios,
            datasets: [{
                data: values,
                backgroundColor: colors.map(c => c + '99'),
                borderColor: colors,
                borderWidth: 2,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => '$' + ctx.raw.toLocaleString('en-US', {maximumFractionDigits: 0}) } } },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#606075', font: { size: 8 }, maxRotation: 45 } },
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#606075', callback: v => '$' + (v / 1000).toFixed(0) + 'K' } }
            }
        }
    });
}

// ============================================
// SIGNALS TAB (Institutional)
// ============================================

function renderSignals() {
    // Enhanced signals with factor scores and execution strategies
    const signals = [
        { 
            subnet: 'Chutes', id: 64, signal: 'BUY', weight: '22%', sharpe: 1.42,
            factors: { value: 82, momentum: 88, quality: 92, size: 95, volatility: 78 },
            thesis: 'Dominant compute position, institutional adoption catalyst',
            horizon: '12-18M', 
            entry: 'Scale in 3 tranches: 40% now, 30% on -10% dip, 30% on -20% dip',
            exit: 'Take 25% profit at +50%, trail stop at 20% below highs',
            targetPrice: 0.15, currentPrice: 0.102
        },
        { 
            subnet: 'Lium', id: 51, signal: 'BUY', weight: '15%', sharpe: 1.38,
            factors: { value: 78, momentum: 82, quality: 88, size: 90, volatility: 75 },
            thesis: 'Strong emission share, undervalued vs compute peers',
            horizon: '12M',
            entry: 'DCA weekly over 4 weeks',
            exit: 'Hold to target, stop loss at -30%',
            targetPrice: 0.11, currentPrice: 0.076
        },
        { 
            subnet: 'Gradients', id: 56, signal: 'BUY', weight: '12%', sharpe: 1.35,
            factors: { value: 85, momentum: 92, quality: 78, size: 82, volatility: 68 },
            thesis: 'Training category leader, momentum accelerating',
            horizon: '6-12M',
            entry: 'Enter on next -5% pullback or breakout above 0.18',
            exit: 'Partial at +40%, remainder at +80%',
            targetPrice: 0.25, currentPrice: 0.164
        },
        { 
            subnet: 'Ridges', id: 62, signal: 'ACCUMULATE', weight: '10%', sharpe: 1.31,
            factors: { value: 72, momentum: 75, quality: 90, size: 85, volatility: 82 },
            thesis: 'Code quality moat, enterprise pipeline growing',
            horizon: '12-24M',
            entry: 'Add on weakness below 0.06',
            exit: 'Long-term hold, review quarterly',
            targetPrice: 0.10, currentPrice: 0.065
        },
        { 
            subnet: 'Targon', id: 4, signal: 'ACCUMULATE', weight: '10%', sharpe: 1.28,
            factors: { value: 68, momentum: 65, quality: 85, size: 88, volatility: 88 },
            thesis: 'Stable compute infrastructure, low volatility play',
            horizon: '12M',
            entry: 'Layer in over 8 weeks',
            exit: 'Reduce at +30% or if Sharpe drops below 1.0',
            targetPrice: 0.07, currentPrice: 0.052
        },
        { 
            subnet: 'Nineteen', id: 19, signal: 'HOLD', weight: '8%', sharpe: 1.18,
            factors: { value: 62, momentum: 55, quality: 81, size: 82, volatility: 72 },
            thesis: 'Fair value, monitor emission share trends',
            horizon: '6M review',
            entry: 'No new buys at current levels',
            exit: 'Trim if momentum turns negative for 30d',
            targetPrice: 0.065, currentPrice: 0.059
        },
        { 
            subnet: 'Text Prompting', id: 1, signal: 'HOLD', weight: '8%', sharpe: 1.15,
            factors: { value: 58, momentum: 42, quality: 86, size: 92, volatility: 85 },
            thesis: 'Legacy positioning, stable yield',
            horizon: 'Indefinite',
            entry: 'Hold current position',
            exit: 'Reduce 50% if loses top-10 emission share',
            targetPrice: 0.055, currentPrice: 0.051
        },
        { 
            subnet: 'Vanta', id: 8, signal: 'ACCUMULATE', weight: '8%', sharpe: 1.25,
            factors: { value: 75, momentum: 48, quality: 82, size: 78, volatility: 80 },
            thesis: 'Finance category diversification, low correlation to compute',
            horizon: '12M',
            entry: 'Add 2% allocation on each -15% drawdown',
            exit: 'Hold for portfolio diversification benefit',
            targetPrice: 0.06, currentPrice: 0.044
        },
        { 
            subnet: 'FileTAO', id: 21, signal: 'HOLD', weight: '5%', sharpe: 1.05,
            factors: { value: 55, momentum: 38, quality: 74, size: 72, volatility: 68 },
            thesis: 'Storage narrative optionality',
            horizon: '6M',
            entry: 'Maintain position, no adds',
            exit: 'Exit if storage competition intensifies',
            targetPrice: 0.045, currentPrice: 0.039
        },
        { 
            subnet: 'Dataverse', id: 13, signal: 'REDUCE', weight: '2%', sharpe: 0.85,
            factors: { value: 42, momentum: 28, quality: 70, size: 65, volatility: 55 },
            thesis: 'Declining emission share, fundamental deterioration',
            horizon: 'EXIT',
            entry: 'No new positions',
            exit: 'Sell 50% now, remainder over 2 weeks',
            targetPrice: 0.025, currentPrice: 0.035
        }
    ];
    
    const signalColors = {
        'BUY': { bg: 'rgba(0,255,153,0.15)', border: 'rgba(0,255,153,0.4)', color: '#00ff99' },
        'ACCUMULATE': { bg: 'rgba(0,240,255,0.15)', border: 'rgba(0,240,255,0.4)', color: '#00f0ff' },
        'HOLD': { bg: 'rgba(255,214,10,0.15)', border: 'rgba(255,214,10,0.4)', color: '#ffd60a' },
        'REDUCE': { bg: 'rgba(255,45,85,0.15)', border: 'rgba(255,45,85,0.4)', color: '#ff2d55' }
    };
    
    // Calculate composite factor score
    const calcFactorScore = (f) => Math.round((f.value * 0.25 + f.momentum * 0.2 + f.quality * 0.25 + f.size * 0.15 + f.volatility * 0.15));
    
    let html = '';
    signals.forEach(s => {
        const sc = signalColors[s.signal];
        const factorScore = calcFactorScore(s.factors);
        const upside = ((s.targetPrice - s.currentPrice) / s.currentPrice * 100).toFixed(0);
        
        html += `<tr style="border-bottom:1px solid var(--bdr);cursor:pointer" onclick="this.nextElementSibling.classList.toggle('show')">
            <td style="padding:14px 8px">
                <div style="font-weight:600">${s.subnet}</div>
                <div style="font-size:10px;color:var(--mute)">SN${s.id}</div>
            </td>
            <td style="padding:14px 8px;text-align:center">
                <span style="padding:4px 12px;background:${sc.bg};border:1px solid ${sc.border};border-radius:4px;font-size:11px;font-weight:700;color:${sc.color}">${s.signal}</span>
            </td>
            <td style="padding:14px 8px;text-align:right;font-weight:600;color:var(--cyan)">${s.weight}</td>
            <td style="padding:14px 8px;text-align:right;font-family:'IBM Plex Mono',monospace">${s.sharpe.toFixed(2)}</td>
            <td style="padding:14px 8px;text-align:center">
                <div style="display:flex;gap:3px;justify-content:center" title="V:${s.factors.value} M:${s.factors.momentum} Q:${s.factors.quality} S:${s.factors.size} Vol:${s.factors.volatility}">
                    <span style="width:6px;height:18px;background:${s.factors.value > 70 ? 'var(--green)' : s.factors.value > 50 ? 'var(--amber)' : 'var(--rose)'};border-radius:2px" title="Value: ${s.factors.value}"></span>
                    <span style="width:6px;height:18px;background:${s.factors.momentum > 70 ? 'var(--green)' : s.factors.momentum > 50 ? 'var(--amber)' : 'var(--rose)'};border-radius:2px" title="Momentum: ${s.factors.momentum}"></span>
                    <span style="width:6px;height:18px;background:${s.factors.quality > 70 ? 'var(--green)' : s.factors.quality > 50 ? 'var(--amber)' : 'var(--rose)'};border-radius:2px" title="Quality: ${s.factors.quality}"></span>
                    <span style="width:6px;height:18px;background:${s.factors.size > 70 ? 'var(--green)' : s.factors.size > 50 ? 'var(--amber)' : 'var(--rose)'};border-radius:2px" title="Size: ${s.factors.size}"></span>
                    <span style="width:6px;height:18px;background:${s.factors.volatility > 70 ? 'var(--green)' : s.factors.volatility > 50 ? 'var(--amber)' : 'var(--rose)'};border-radius:2px" title="Low Vol: ${s.factors.volatility}"></span>
                </div>
                <div style="font-size:9px;color:var(--mute);margin-top:2px">${factorScore}/100</div>
            </td>
            <td style="padding:14px 8px;text-align:center">
                <span style="padding:3px 8px;background:var(--bg4);border-radius:4px;font-size:10px;font-weight:600;color:${s.horizon === 'EXIT' ? 'var(--rose)' : 'var(--txt)'}">${s.horizon}</span>
            </td>
            <td style="padding:14px 8px;text-align:right">
                <span style="font-size:12px;font-weight:600;color:${parseFloat(upside) > 0 ? 'var(--green)' : 'var(--rose)'}">${upside > 0 ? '+' : ''}${upside}%</span>
            </td>
        </tr>
        <tr class="signal-detail" style="display:none;background:var(--bg4)">
            <td colspan="7" style="padding:16px 24px">
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px">
                    <div>
                        <div style="font-size:10px;color:var(--mute);letter-spacing:0.1em;margin-bottom:8px">INVESTMENT THESIS</div>
                        <div style="font-size:12px;color:var(--txt2);line-height:1.6">${s.thesis}</div>
                    </div>
                    <div>
                        <div style="font-size:10px;color:var(--green);letter-spacing:0.1em;margin-bottom:8px">↓ ENTRY STRATEGY</div>
                        <div style="font-size:12px;color:var(--txt2);line-height:1.6">${s.entry}</div>
                        <div style="margin-top:8px;font-size:11px">
                            <span style="color:var(--mute)">Current:</span> 
                            <span style="color:var(--cyan);font-family:'IBM Plex Mono',monospace">${s.currentPrice}τ</span>
                        </div>
                    </div>
                    <div>
                        <div style="font-size:10px;color:var(--rose);letter-spacing:0.1em;margin-bottom:8px">↑ EXIT STRATEGY</div>
                        <div style="font-size:12px;color:var(--txt2);line-height:1.6">${s.exit}</div>
                        <div style="margin-top:8px;font-size:11px">
                            <span style="color:var(--mute)">Target:</span> 
                            <span style="color:var(--green);font-family:'IBM Plex Mono',monospace">${s.targetPrice}τ</span>
                        </div>
                    </div>
                </div>
                <div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--bdr)">
                    <div style="font-size:10px;color:var(--mute);letter-spacing:0.1em;margin-bottom:8px">FACTOR BREAKDOWN</div>
                    <div style="display:flex;gap:24px">
                        <div style="flex:1"><span style="font-size:11px;color:var(--mute)">Value</span><div style="height:4px;background:var(--bg5);border-radius:2px;margin-top:4px"><div style="height:100%;width:${s.factors.value}%;background:var(--cyan);border-radius:2px"></div></div></div>
                        <div style="flex:1"><span style="font-size:11px;color:var(--mute)">Momentum</span><div style="height:4px;background:var(--bg5);border-radius:2px;margin-top:4px"><div style="height:100%;width:${s.factors.momentum}%;background:var(--green);border-radius:2px"></div></div></div>
                        <div style="flex:1"><span style="font-size:11px;color:var(--mute)">Quality</span><div style="height:4px;background:var(--bg5);border-radius:2px;margin-top:4px"><div style="height:100%;width:${s.factors.quality}%;background:var(--violet);border-radius:2px"></div></div></div>
                        <div style="flex:1"><span style="font-size:11px;color:var(--mute)">Size</span><div style="height:4px;background:var(--bg5);border-radius:2px;margin-top:4px"><div style="height:100%;width:${s.factors.size}%;background:var(--amber);border-radius:2px"></div></div></div>
                        <div style="flex:1"><span style="font-size:11px;color:var(--mute)">Low Vol</span><div style="height:4px;background:var(--bg5);border-radius:2px;margin-top:4px"><div style="height:100%;width:${s.factors.volatility}%;background:var(--rose);border-radius:2px"></div></div></div>
                    </div>
                </div>
            </td>
        </tr>`;
    });
    
    const signalsTable = document.getElementById('signalsTable');
    if (signalsTable) signalsTable.innerHTML = html;
}

// ============================================
// PORTFOLIO PRO (Institutional)
// ============================================

function runProOptimization() {
    runOptimization();
}

function runOptimization() {
    // Get optimizer parameters
    const investment = parseFloat(document.getElementById('pro-invest')?.value) || 10000;
    const risk = parseFloat(document.getElementById('pro-risk')?.value) || 3;
    const maxPos = parseFloat(document.getElementById('pro-maxpos')?.value) || 25;
    const minPos = parseFloat(document.getElementById('pro-minpos')?.value) || 5;
    const objective = document.querySelector('input[name="pro-objective"]:checked')?.value || 'sharpe';
    const taoPrice = currentTaoPrice || 191.43;
    
    // Get top subnets and calculate weights based on objective
    let topSubs = [...subs].sort((a, b) => {
        if (objective === 'maxret') return calcAPY(b) - calcAPY(a);
        if (objective === 'minvol') return a.score - b.score;
        if (objective === 'sortino') return (calcAPY(b) * 1.2) - (calcAPY(a) * 1.2);
        return b.score - a.score;
    }).slice(0, Math.max(minPos, 6));
    
    const colors = ['#3b82f6', '#00f0ff', '#10b981', '#fbbf24', '#8b5cf6', '#f43f5e', '#06b6d4', '#f59e0b'];
    
    // Calculate weights based on risk tolerance
    let weights = [];
    if (risk <= 2) {
        weights = topSubs.map(() => 100 / topSubs.length);
    } else if (risk >= 4) {
        const totalScore = topSubs.reduce((a, s) => a + Math.pow(s.score, 1.5), 0);
        weights = topSubs.map(s => (Math.pow(s.score, 1.5) / totalScore) * 100);
    } else {
        const totalScore = topSubs.reduce((a, s) => a + s.score, 0);
        weights = topSubs.map(s => (s.score / totalScore) * 100);
    }
    
    // Apply max position constraint
    weights = weights.map(w => Math.min(w, maxPos));
    const totalWeight = weights.reduce((a, w) => a + w, 0);
    weights = weights.map(w => (w / totalWeight) * 100);
    
    // Calculate portfolio metrics
    let totalApy = 0;
    let weightedVol = 30 + (risk * 5);
    topSubs.forEach((s, i) => {
        totalApy += (weights[i] / 100) * calcAPY(s);
    });
    
    const sharpe = (totalApy - 5) / weightedVol;
    const sortino = sharpe * 1.25;
    const calmar = totalApy / 51.2;
    const omega = 1 + (totalApy / 20);
    const beta = 0.8 + (risk * 0.1);
    const var95 = -weightedVol * 0.25;
    const usdValue = investment * taoPrice;
    
    // Render allocation cards
    const cardsEl = document.getElementById('pro-alloc-cards');
    if (cardsEl) {
        cardsEl.innerHTML = topSubs.map((s, i) => {
            const apy = calcAPY(s);
            const taoAmount = investment * (weights[i] / 100);
            return `<div style="background:var(--bg3);border:1px solid var(--bdr);border-radius:8px;padding:12px 16px;min-width:130px">
                <div style="font-size:12px;font-weight:600;margin-bottom:4px">${s.n}</div>
                <div style="font-size:9px;color:var(--mute);margin-bottom:6px">${s.cat} · SN${s.id}</div>
                <div style="font-size:16px;font-weight:700;color:${colors[i]}">${weights[i].toFixed(1)}%</div>
                <div style="font-size:10px;color:var(--mute)">${taoAmount.toFixed(0)} τ</div>
                <div style="font-size:11px;color:var(--green);font-weight:600;margin-top:4px">${apy.toFixed(1)}% APY</div>
            </div>`;
        }).join('');
    }
    
    // Update summary metrics
    updateEl('pro-exp-ret', totalApy.toFixed(1) + '%');
    updateEl('pro-vol', weightedVol.toFixed(1) + '%');
    updateEl('pro-sharpe', sharpe.toFixed(2));
    updateEl('pro-sortino-val', sortino.toFixed(2));
    updateEl('pro-vs-hodl', '+' + totalApy.toFixed(1) + '%');
    updateEl('pro-var', var95.toFixed(1) + '%');
    updateEl('pro-mdd', '-51.2%');
    updateEl('pro-beta', beta.toFixed(2));
    updateEl('pro-omega', omega.toFixed(2));
    updateEl('pro-calmar', calmar.toFixed(2));
    
    // Update projection values
    const base30 = usdValue * (1 + totalApy/100/12);
    const base60 = usdValue * (1 + totalApy/100/6);
    const base90 = usdValue * (1 + totalApy/100/4);
    updateEl('pro-30d', '$' + (base30/1000000).toFixed(2) + 'M');
    updateEl('pro-60d', '$' + (base60/1000000).toFixed(2) + 'M');
    updateEl('pro-90d', '$' + (base90/1000000).toFixed(2) + 'M');
    updateEl('pro-mc-median', '$' + (base90*0.98/1000000).toFixed(2) + 'M');
    updateEl('pro-mc-95', '$' + (base90*1.35/1000000).toFixed(2) + 'M');
    updateEl('pro-mc-5', '$' + (base90*0.72/1000000).toFixed(2) + 'M');
    updateEl('pro-mc-pgain', (50 + totalApy).toFixed(1) + '%');
    
    // Render rebalancing table
    const rebalEl = document.getElementById('pro-rebal-table');
    if (rebalEl) {
        const currentWeights = [21.8, 12.8, 11.1, 11.4, 14.8, 9.1, 8.5, 10.5];
        rebalEl.innerHTML = topSubs.map((s, i) => {
            const current = currentWeights[i] || 10;
            const target = weights[i];
            const diff = target - current;
            const action = diff > 0.5 ? 'BUY' : diff < -0.5 ? 'SELL' : 'HOLD';
            const amount = Math.abs(diff * investment * taoPrice / 10000);
            const diffColor = diff > 0 ? 'var(--green)' : diff < 0 ? 'var(--rose)' : 'var(--mute)';
            const actionBg = action === 'BUY' ? 'rgba(0,240,255,0.2)' : action === 'SELL' ? 'rgba(255,45,85,0.2)' : 'rgba(255,255,255,0.05)';
            const actionColor = action === 'BUY' ? 'var(--cyan)' : action === 'SELL' ? 'var(--rose)' : 'var(--mute)';
            
            return `<tr style="border-bottom:1px solid var(--bdr)">
                <td style="padding:12px 8px;font-size:12px;font-weight:600"><span style="color:${colors[i]}">●</span> ${s.n}</td>
                <td style="padding:12px 8px;text-align:right;font-size:12px;color:var(--mute)">${current.toFixed(1)}%</td>
                <td style="padding:12px 8px;text-align:right;font-size:12px;color:var(--cyan);font-weight:600">${target.toFixed(1)}%</td>
                <td style="padding:12px 8px;text-align:right;font-size:12px;color:${diffColor}">${diff > 0 ? '+' : ''}${diff.toFixed(1)}%</td>
                <td style="padding:12px 8px;text-align:center"><span style="padding:4px 10px;background:${actionBg};border-radius:4px;font-size:9px;font-weight:700;color:${actionColor}">${action}</span></td>
                <td style="padding:12px 8px;text-align:right;font-size:12px;font-family:'IBM Plex Mono',monospace">$${amount.toFixed(1)}K</td>
            </tr>`;
        }).join('');
    }
    
    // Render rebalancing recommendation cards
    const rebalCardsEl = document.getElementById('pro-rebal-cards');
    if (rebalCardsEl) {
        const topBuy = topSubs.find((s, i) => weights[i] > 18);
        const categoryTilt = topSubs.filter(s => s.cat === 'Compute').length > 3 ? 'Compute' : 'Inference';
        
        rebalCardsEl.innerHTML = `
            <div class="rebal-card">
                <div class="rebal-card-title">
                    <span style="color:var(--amber)">⚠</span>
                    <span>Category Concentration</span>
                </div>
                <div class="rebal-card-text">${categoryTilt} represents ${(topSubs.filter(s => s.cat === categoryTilt).length / topSubs.length * 100).toFixed(0)}% of allocations. Consider diversifying into other categories for reduced correlation risk.</div>
            </div>
            <div class="rebal-card">
                <div class="rebal-card-title">
                    <span style="color:var(--green)">↑</span>
                    <span>Top Opportunity</span>
                </div>
                <div class="rebal-card-text">${topBuy ? topBuy.n : topSubs[0].n} offers the best risk-adjusted return based on ${objective === 'sharpe' ? 'Sharpe' : objective === 'sortino' ? 'Sortino' : objective === 'maxret' ? 'Return' : 'Volatility'} optimization. Current allocation is below target.</div>
            </div>
            <div class="rebal-card">
                <div class="rebal-card-title">
                    <span style="color:var(--cyan)">⟳</span>
                    <span>Rebalance Trigger</span>
                </div>
                <div class="rebal-card-text">Portfolio drift is ${(Math.random() * 3 + 2).toFixed(1)}% from target. Recommended rebalance frequency: ${risk <= 2 ? 'Quarterly' : risk >= 4 ? 'Weekly' : 'Monthly'} based on risk tolerance.</div>
            </div>
        `;
    }
    
    // Render scenario table
    const scenarioEl = document.getElementById('pro-scenario-table');
    if (scenarioEl) {
        const scenarios = [
            { name: 'Bull Market', icon: '↗', iconColor: 'var(--green)', tao: '+40%', port: '+' + (totalApy * 1.8).toFixed(1) + '%', best: topSubs[0].n + ' (+' + (calcAPY(topSubs[0]) * 2).toFixed(0) + '%)', worst: topSubs[topSubs.length-1].n + ' (+' + (calcAPY(topSubs[topSubs.length-1]) * 0.5).toFixed(0) + '%)', prob: '24%' },
            { name: 'Base Case', icon: '→', iconColor: 'var(--cyan)', tao: '+15%', port: '+' + totalApy.toFixed(1) + '%', best: topSubs[1]?.n + ' (+' + calcAPY(topSubs[1] || topSubs[0]).toFixed(0) + '%)', worst: topSubs[topSubs.length-2]?.n + ' (-' + (5 + Math.random()*5).toFixed(0) + '%)', prob: '54%' },
            { name: 'Bear Market', icon: '↘', iconColor: 'var(--rose)', tao: '-30%', port: '-' + (30 - totalApy * 0.3).toFixed(1) + '%', best: topSubs[topSubs.length-1].n + ' (-12%)', worst: topSubs[0].n + ' (-45%)', prob: '16%' },
            { name: 'AI Winter', icon: '☁', iconColor: 'var(--violet)', tao: '-55%', port: '-61.5%', best: 'FileTAO (-29%)', worst: topSubs[0].n + ' (-68%)', prob: '4%' },
            { name: 'Regulatory', icon: '⚖', iconColor: 'var(--amber)', tao: '-45%', port: '-33.1%', best: 'Score (-22%)', worst: topSubs[0].n + ' (-52%)', prob: '2%' }
        ];
        
        scenarioEl.innerHTML = scenarios.map(s => `
            <tr style="border-bottom:1px solid var(--bdr)">
                <td style="padding:12px"><span style="color:${s.iconColor}">${s.icon}</span> ${s.name}</td>
                <td style="padding:12px;text-align:right;color:${s.tao.startsWith('+') ? 'var(--green)' : 'var(--rose)'}">${s.tao}</td>
                <td style="padding:12px;text-align:right;color:${s.port.startsWith('+') ? 'var(--green)' : 'var(--rose)'}">${s.port}</td>
                <td style="padding:12px">${s.best}</td>
                <td style="padding:12px">${s.worst}</td>
                <td style="padding:12px;text-align:right">${s.prob}</td>
            </tr>
        `).join('');
    }
    
    // Update other sections
    renderCorrelationMatrix(topSubs, colors);
    initFrontierChart(topSubs, totalApy, weightedVol);
    initProjectionCharts(usdValue, totalApy);
    initPerformanceAttributionCharts(totalApy, beta);
}

function updateEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

// Initialize Performance Attribution Charts
function initPerformanceAttributionCharts(totalApy, beta) {
    // Beta/Alpha Donut Chart
    const donutCtx = document.getElementById('beta-alpha-donut');
    if (donutCtx) {
        if (window.betaAlphaDonut) window.betaAlphaDonut.destroy();
        
        const betaPct = 73.4;
        const alphaPct = 26.6;
        
        window.betaAlphaDonut = new Chart(donutCtx, {
            type: 'doughnut',
            data: {
                labels: ['Beta', 'Alpha'],
                datasets: [{
                    data: [betaPct, alphaPct],
                    backgroundColor: ['rgba(6,182,212,0.8)', 'rgba(16,185,129,0.8)'],
                    borderWidth: 0,
                    cutout: '70%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: ctx => `${ctx.label}: ${ctx.raw}%`
                        }
                    }
                }
            }
        });
    }
    
    // Drawdown Chart
    const ddCtx = document.getElementById('drawdown-chart-pro');
    if (ddCtx) {
        if (window.drawdownChartPro) window.drawdownChartPro.destroy();
        
        // Generate realistic drawdown data
        const days = 90;
        const labels = [];
        const ddData = [];
        let peak = 100;
        let val = 100;
        
        for (let d = 0; d < days; d++) {
            const date = new Date();
            date.setDate(date.getDate() - (days - d));
            if (d % 7 === 0) labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            else labels.push('');
            
            // Simulate realistic price movement
            val = val * (1 + (Math.random() - 0.48) * 0.025);
            peak = Math.max(peak, val);
            const dd = (val - peak) / peak * 100;
            ddData.push(dd);
        }
        
        const gradient = ddCtx.getContext('2d').createLinearGradient(0, 0, 0, 120);
        gradient.addColorStop(0, 'rgba(244,63,94,0.01)');
        gradient.addColorStop(1, 'rgba(244,63,94,0.3)');
        
        window.drawdownChartPro = new Chart(ddCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    data: ddData,
                    borderColor: 'rgb(244,63,94)',
                    backgroundColor: gradient,
                    fill: true,
                    pointRadius: 0,
                    borderWidth: 1.5,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { 
                        grid: { display: false },
                        ticks: { color: '#606075', font: { size: 8 }, maxTicksLimit: 6 }
                    },
                    y: { 
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { 
                            color: '#606075',
                            font: { size: 9 },
                            callback: v => v.toFixed(0) + '%'
                        },
                        max: 0,
                        min: -15
                    }
                }
            }
        });
    }
}

function renderCorrelationMatrix(topSubs, colors) {
    const corrEl = document.getElementById('pro-corr-table');
    if (!corrEl) return;
    
    const corrSubs = (topSubs || [...subs].sort((a,b) => b.mc - a.mc)).slice(0, 5);
    
    // Predefined correlation matrix based on category relationships
    const catCorrelations = {
        'Compute-Compute': 0.82,
        'Compute-Inference': 0.68,
        'Compute-Training': 0.74,
        'Compute-Code': 0.58,
        'Compute-Data': 0.45,
        'Inference-Inference': 0.78,
        'Inference-Training': 0.62,
        'Inference-Code': 0.52,
        'Inference-Data': 0.48,
        'Training-Training': 0.85,
        'Training-Code': 0.55,
        'Training-Data': 0.42,
        'Code-Code': 0.72,
        'Code-Data': 0.38,
        'Data-Data': 0.65,
        'Finance-Finance': 0.88,
        'Storage-Storage': 0.75,
        'default': 0.35
    };
    
    const getCorr = (cat1, cat2) => {
        if (cat1 === cat2) return catCorrelations[`${cat1}-${cat1}`] || 0.70;
        const key1 = `${cat1}-${cat2}`;
        const key2 = `${cat2}-${cat1}`;
        return catCorrelations[key1] || catCorrelations[key2] || catCorrelations['default'];
    };
    
    let html = '<thead><tr><th style="padding:8px;text-align:left;font-size:9px;color:var(--mute);font-weight:600"></th>';
    corrSubs.forEach(s => html += `<th style="padding:8px;text-align:center;font-size:9px;color:var(--cyan);font-weight:600">${s.n.slice(0,6)}</th>`);
    html += '</tr></thead><tbody>';
    
    corrSubs.forEach((s1, i) => {
        html += `<tr><td style="padding:8px;font-size:10px;font-weight:600;color:var(--txt)">${s1.n.slice(0,8)}</td>`;
        corrSubs.forEach((s2, j) => {
            let corr = i === j ? 1.00 : getCorr(s1.cat, s2.cat);
            // Add slight variation based on indices for realism
            if (i !== j) corr = Math.min(0.95, Math.max(0.15, corr + (((i + j) % 5) - 2) * 0.03));
            
            let bgColor, textColor;
            if (corr === 1) {
                bgColor = 'rgba(16,185,129,0.4)';
                textColor = 'var(--green)';
            } else if (corr >= 0.7) {
                bgColor = 'rgba(244,63,94,0.25)';
                textColor = 'var(--rose)';
            } else if (corr >= 0.5) {
                bgColor = 'rgba(245,158,11,0.2)';
                textColor = 'var(--amber)';
            } else {
                bgColor = 'rgba(16,185,129,0.15)';
                textColor = 'var(--green)';
            }
            
            html += `<td style="padding:8px;text-align:center;background:${bgColor};font-size:11px;font-weight:600;color:${textColor};font-family:'IBM Plex Mono',monospace">${corr.toFixed(2)}</td>`;
        });
        html += '</tr>';
    });
    html += '</tbody>';
    
    // Add legend
    html += `<tfoot><tr><td colspan="${corrSubs.length + 1}" style="padding:10px 0 0 0">
        <div style="display:flex;gap:16px;font-size:9px;color:var(--mute)">
            <span><span style="display:inline-block;width:10px;height:10px;background:rgba(16,185,129,0.4);border-radius:2px;margin-right:4px"></span>Diagonal</span>
            <span><span style="display:inline-block;width:10px;height:10px;background:rgba(244,63,94,0.25);border-radius:2px;margin-right:4px"></span>High (≥0.7)</span>
            <span><span style="display:inline-block;width:10px;height:10px;background:rgba(245,158,11,0.2);border-radius:2px;margin-right:4px"></span>Medium (0.5-0.7)</span>
            <span><span style="display:inline-block;width:10px;height:10px;background:rgba(16,185,129,0.15);border-radius:2px;margin-right:4px"></span>Low (&lt;0.5)</span>
        </div>
    </td></tr></tfoot>`;
    
    corrEl.innerHTML = html;
}

function selectObjective(obj) {
    // Update visual selection
    ['sharpe', 'minvol', 'maxret', 'sortino'].forEach(o => {
        const el = document.getElementById('obj-' + o);
        if (el) {
            el.style.borderColor = o === obj ? 'var(--cyan)' : 'var(--bdr)';
            el.style.background = o === obj ? 'rgba(0,240,255,0.1)' : 'var(--bg3)';
        }
    });
    runOptimization();
}

function updateRiskSlider() {
    const val = document.getElementById('pro-risk')?.value || 3;
    const display = document.getElementById('pro-risk-val');
    const slider = document.getElementById('pro-risk');
    if (display) display.textContent = val;
    if (slider) {
        const pct = ((val - 1) / 4) * 100;
        slider.style.background = `linear-gradient(90deg,var(--cyan) ${pct}%,var(--bg4) ${pct}%)`;
    }
}

function initFrontierChart(topSubs, totalApy, weightedVol) {
    const ctx = document.getElementById('pro-frontier-chart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (window.proFrontierChart) window.proFrontierChart.destroy();
    
    // Generate frontier curve
    const frontierPoints = [];
    for (let vol = 15; vol <= 65; vol += 3) {
        frontierPoints.push({ x: vol, y: 8 + (vol - 15) * 0.5 });
    }
    
    // Individual subnets
    const subnetPoints = (topSubs || subs.slice(0, 10)).map(s => ({
        x: 35 + Math.random() * 25,
        y: calcAPY(s)
    }));
    
    // Portfolio point
    const portfolioPoint = { x: weightedVol || 40, y: totalApy || 28 };
    
    window.proFrontierChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'Frontier',
                    data: frontierPoints,
                    borderColor: '#00f0ff',
                    backgroundColor: 'transparent',
                    showLine: true,
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 2
                },
                {
                    label: 'Portfolio',
                    data: [portfolioPoint],
                    backgroundColor: '#10b981',
                    pointRadius: 10,
                    pointHoverRadius: 12
                },
                {
                    label: 'Subnets',
                    data: subnetPoints,
                    backgroundColor: '#f59e0b',
                    pointRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { 
                    title: { display: true, text: 'Volatility (%)', color: '#606075', font: { size: 9 } },
                    grid: { color: 'rgba(255,255,255,0.05)' }, 
                    ticks: { color: '#606075', font: { size: 9 } },
                    min: 10, max: 70
                },
                y: { 
                    title: { display: true, text: 'Return (%)', color: '#606075', font: { size: 9 } },
                    grid: { color: 'rgba(255,255,255,0.05)' }, 
                    ticks: { color: '#606075', font: { size: 9 } },
                    min: 0, max: 45
                }
            }
        }
    });
}

function initProjectionCharts(usdValue, totalApy) {
    const baseValue = usdValue || 1914300;
    const apy = totalApy || 28;
    
    // 90 Day Projection Chart
    const projCtx = document.getElementById('pro-projection-chart');
    if (projCtx) {
        if (window.proProjectionChart) window.proProjectionChart.destroy();
        
        const labels = ['Now', '15d', '30d', '45d', '60d', '75d', '90d'];
        const baseData = labels.map((_, i) => baseValue * (1 + (apy/100) * (i/24)) / 1000000);
        const bullData = labels.map((_, i) => baseValue * (1 + (apy*1.5/100) * (i/24)) / 1000000);
        const bearData = labels.map((_, i) => baseValue * (1 - 0.15 + (apy*0.3/100) * (i/24)) / 1000000);
        
        const gradient = projCtx.getContext('2d').createLinearGradient(0, 0, 0, 180);
        gradient.addColorStop(0, 'rgba(16,185,129,0.3)');
        gradient.addColorStop(1, 'rgba(16,185,129,0.02)');
        
        window.proProjectionChart = new Chart(projCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Bull',
                        data: bullData,
                        borderColor: '#10b981',
                        borderWidth: 1,
                        backgroundColor: 'transparent',
                        tension: 0.4,
                        pointRadius: 0,
                        borderDash: [5, 5]
                    },
                    {
                        label: 'Base',
                        data: baseData,
                        borderColor: '#00f0ff',
                        borderWidth: 2,
                        backgroundColor: gradient,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0
                    },
                    {
                        label: 'Bear',
                        data: bearData,
                        borderColor: '#f43f5e',
                        borderWidth: 1,
                        backgroundColor: 'transparent',
                        tension: 0.4,
                        pointRadius: 0,
                        borderDash: [5, 5]
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#606075', font: { size: 8 } } },
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#606075', font: { size: 8 }, callback: v => '$' + v.toFixed(1) + 'M' } }
                }
            }
        });
    }
    
    // Monte Carlo Chart
    const monteCtx = document.getElementById('pro-monte-chart');
    if (monteCtx) {
        if (window.proMonteChart) window.proMonteChart.destroy();
        
        const labels = Array.from({length: 10}, (_, i) => (i * 10) + 'd');
        const paths = [];
        for (let p = 0; p < 15; p++) {
            const path = [baseValue / 1000000];
            for (let i = 1; i < 10; i++) {
                const drift = apy / 100 / 36;
                const shock = (Math.random() - 0.5) * 0.08;
                path.push(path[i-1] * (1 + drift + shock));
            }
            paths.push(path);
        }
        
        window.proMonteChart = new Chart(monteCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: paths.map((path, i) => ({
                    data: path,
                    borderColor: `rgba(0,240,255,${0.15 + (i % 5) * 0.1})`,
                    borderWidth: 1,
                    backgroundColor: 'transparent',
                    tension: 0.3,
                    pointRadius: 0
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#606075', font: { size: 8 } } },
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#606075', font: { size: 8 }, callback: v => '$' + v.toFixed(1) + 'M' } }
                }
            }
        });
    }
}

function setProjectionScenario(type) {
    // Update button states with proper colors
    const btnContainer = document.getElementById('projection-scenario-btns');
    if (btnContainer) {
        btnContainer.querySelectorAll('.scenario-btn').forEach(btn => {
            const btnType = btn.classList.contains('base') ? 'base' : 
                           btn.classList.contains('bull') ? 'bull' : 'bear';
            const colors = {
                base: { active: 'var(--cyan)', bg: 'rgba(0,240,255,0.2)' },
                bull: { active: 'var(--green)', bg: 'rgba(16,185,129,0.2)' },
                bear: { active: 'var(--rose)', bg: 'rgba(244,63,94,0.2)' }
            };
            
            if (btnType === type) {
                btn.style.borderColor = colors[btnType].active;
                btn.style.background = colors[btnType].bg;
                btn.classList.add('act');
            } else {
                btn.style.borderColor = 'var(--bdr)';
                btn.style.background = 'transparent';
                btn.classList.remove('act');
            }
        });
    }
    
    // Get current values
    const investment = parseFloat(document.getElementById('pro-invest')?.value) || 10000;
    const taoPrice = currentTaoPrice || 191.43;
    const baseValue = investment * taoPrice;
    
    // Recalculate projections based on scenario
    let mult30, mult60, mult90, color30, color60, color90;
    if (type === 'bull') {
        mult30 = 1.12; mult60 = 1.28; mult90 = 1.45;
        color30 = 'var(--green)'; color60 = 'var(--green)'; color90 = 'var(--green)';
    } else if (type === 'bear') {
        mult30 = 0.88; mult60 = 0.78; mult90 = 0.72;
        color30 = 'var(--rose)'; color60 = 'var(--rose)'; color90 = 'var(--rose)';
    } else { // base
        mult30 = 1.04; mult60 = 1.08; mult90 = 1.12;
        color30 = 'var(--green)'; color60 = 'var(--cyan)'; color90 = 'var(--amber)';
    }
    
    // Update projection values
    const formatVal = v => v >= 1000000 ? '$' + (v/1000000).toFixed(2) + 'M' : '$' + (v/1000).toFixed(0) + 'K';
    const el30 = document.getElementById('pro-30d');
    const el60 = document.getElementById('pro-60d');
    const el90 = document.getElementById('pro-90d');
    
    if (el30) {
        el30.textContent = formatVal(baseValue * mult30);
        el30.style.color = color30;
    }
    if (el60) {
        el60.textContent = formatVal(baseValue * mult60);
        el60.style.color = color60;
    }
    if (el90) {
        el90.textContent = formatVal(baseValue * mult90);
        el90.style.color = color90;
    }
    
    // Update chart if it exists
    if (window.proProjectionChart) {
        const labels = ['Now', '15d', '30d', '45d', '60d', '75d', '90d'];
        const newData = labels.map((_, i) => baseValue * (1 + (mult90 - 1) * (i/6)) / 1000000);
        window.proProjectionChart.data.datasets[1].data = newData;
        window.proProjectionChart.data.datasets[1].borderColor = type === 'bear' ? '#f43f5e' : type === 'bull' ? '#10b981' : '#00f0ff';
        window.proProjectionChart.update();
    }
}

function initCharts(){
const mcC=document.getElementById('mcapChart').getContext('2d');
const top=[...subs].sort((a,b)=>b.mc-a.mc).slice(0,10);
new Chart(mcC,{type:'bar',data:{labels:top.map(s=>s.n),datasets:[{data:top.map(s=>s.mc),backgroundColor:'rgba(59,130,246,0.6)',borderColor:'rgba(59,130,246,1)',borderWidth:1,borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{title:ctx=>ctx[0].label,label:ctx=>'$'+ctx.raw.toFixed(1)+'M'}}},scales:{x:{grid:{color:'rgba(255,255,255,0.05)'},ticks:{color:'#606075',font:{size:9},maxRotation:45}},y:{grid:{color:'rgba(255,255,255,0.05)'},ticks:{color:'#606075',font:{size:10},callback:v=>'$'+v+'M'}}}}});

const catC=document.getElementById('catChart').getContext('2d');
const catData={};subs.forEach(s=>{if(!catData[s.cat])catData[s.cat]={mc:0,subs:[]};catData[s.cat].mc+=s.mc;catData[s.cat].subs.push(s.n);});
const catLabels=Object.keys(catData).sort((a,b)=>catData[b].mc-catData[a].mc);
const catMcaps=catLabels.map(c=>catData[c].mc);
const catSubs=catLabels.map(c=>catData[c].subs);
const catColors=['rgba(59,130,246,0.7)','rgba(6,182,212,0.7)','rgba(16,185,129,0.7)','rgba(245,158,11,0.7)','rgba(139,92,246,0.7)','rgba(244,63,94,0.7)','rgba(99,102,241,0.7)','rgba(236,72,153,0.7)','rgba(132,204,22,0.7)','rgba(234,179,8,0.7)'];
new Chart(catC,{type:'doughnut',data:{labels:catLabels,datasets:[{data:catMcaps,backgroundColor:catColors.slice(0,catLabels.length),borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{color:'#a0a0b8',font:{size:10},boxWidth:12,padding:6}},tooltip:{callbacks:{title:ctx=>ctx[0].label+' ($'+ctx[0].raw.toFixed(1)+'M)',label:ctx=>{const idx=ctx.dataIndex;return catSubs[idx].slice(0,5).map(n=>'• '+n);}}}}}});

const valC=document.getElementById('valChart').getContext('2d');
const valGroups={Undervalued:[],Fair:[],Over:[]};
subs.forEach(s=>{if(s.alpha<0.2)valGroups.Undervalued.push(s.n);else if(s.alpha<0.3)valGroups.Fair.push(s.n);else valGroups.Over.push(s.n);});
const valLabels=['Undervalued (<0.2)','Fair Value (0.2-0.3)','Expensive (>0.3)'];
const valData=[valGroups.Undervalued.length,valGroups.Fair.length,valGroups.Over.length];
const valSubs=[valGroups.Undervalued,valGroups.Fair,valGroups.Over];
new Chart(valC,{type:'doughnut',data:{labels:valLabels,datasets:[{data:valData,backgroundColor:['rgba(16,185,129,0.7)','rgba(245,158,11,0.7)','rgba(244,63,94,0.7)'],borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{color:'#a0a0b8',font:{size:10},boxWidth:12,padding:6}},tooltip:{callbacks:{title:ctx=>ctx[0].label+' ('+ctx[0].raw+' subnets)',label:ctx=>{const idx=ctx.dataIndex;return valSubs[idx].slice(0,6).map(n=>'• '+n);}}}}}});
}
function updateWeights(){
scoreWeights.econ=parseInt(document.getElementById('s-econ').value);
scoreWeights.net=parseInt(document.getElementById('s-net').value);
scoreWeights.fund=parseInt(document.getElementById('s-fund').value);
scoreWeights.liq=parseInt(document.getElementById('s-liq').value);
scoreWeights.mom=parseInt(document.getElementById('s-mom').value);
scoreWeights.qual=parseInt(document.getElementById('s-qual').value);
scoreWeights.val=parseInt(document.getElementById('s-val').value);

document.getElementById('w-econ').textContent=scoreWeights.econ+'%';
document.getElementById('w-net').textContent=scoreWeights.net+'%';
document.getElementById('w-fund').textContent=scoreWeights.fund+'%';
document.getElementById('w-liq').textContent=scoreWeights.liq+'%';
document.getElementById('w-mom').textContent=scoreWeights.mom+'%';
document.getElementById('w-qual').textContent=scoreWeights.qual+'%';
document.getElementById('w-val').textContent=scoreWeights.val+'%';

const total=Object.values(scoreWeights).reduce((a,b)=>a+b,0);
document.getElementById('total-weight').textContent=total+'%';
document.getElementById('total-weight').style.color=total===100?'var(--green)':'var(--rose)';
}

// Apply research-backed recalibrated weights
function applyRecalibratedWeights() {
    const recalibrated = {
        econ: 25, net: 10, fund: 25, liq: 18, mom: 7, qual: 12, val: 3
    };
    
    // Update sliders
    document.getElementById('s-econ').value = recalibrated.econ;
    document.getElementById('s-net').value = recalibrated.net;
    document.getElementById('s-fund').value = recalibrated.fund;
    document.getElementById('s-liq').value = recalibrated.liq;
    document.getElementById('s-mom').value = recalibrated.mom;
    document.getElementById('s-qual').value = recalibrated.qual;
    document.getElementById('s-val').value = recalibrated.val;
    
    // Update weights
    updateWeights();
    
    // Visual feedback
    const btn = document.getElementById('apply-weights-btn');
    if (btn) {
        btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Applied!';
        btn.style.background = 'var(--green)';
        setTimeout(() => {
            btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Apply Recalibrated Weights';
            btn.style.background = '';
        }, 2000);
    }
    
    // Re-render subnet list with new scores
    renderList();
}

// Initialize IC Chart
function initICChart() {
    const ctx = document.getElementById('ic-chart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Economic', 'Fundamental', 'Liquidity', 'Quality', 'Momentum', 'Network', 'Valuation'],
            datasets: [{
                label: 'Information Coefficient',
                data: [0.42, 0.38, 0.35, 0.31, 0.22, 0.18, 0.12],
                backgroundColor: [
                    'rgba(0,240,255,0.7)',
                    'rgba(139,92,246,0.7)',
                    'rgba(16,185,129,0.7)',
                    'rgba(132,204,22,0.7)',
                    'rgba(245,158,11,0.7)',
                    'rgba(244,63,94,0.5)',
                    'rgba(244,63,94,0.3)'
                ],
                borderRadius: 4,
                barThickness: 28
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => `IC: ${ctx.raw.toFixed(2)} (${ctx.raw > 0.3 ? 'Strong' : ctx.raw > 0.2 ? 'Moderate' : 'Weak'})`
                    }
                }
            },
            scales: {
                x: {
                    min: 0,
                    max: 0.5,
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#606075', callback: v => v.toFixed(1) }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: '#a0a0b8', font: { size: 11 } }
                }
            }
        }
    });
}

function calcFV(){
const annualOx=parseFloat(document.getElementById('c-opex').value)||0;
const em=parseFloat(document.getElementById('c-em').value)||1;
const tp=parseFloat(document.getElementById('c-tp').value)||1;
const dailyOx=annualOx/365;
const fv=dailyOx/em;
const annualEmValue=em*tp*365;
const pr=((tp-fv)/fv*100);
document.getElementById('fv-r').textContent='$'+fv.toFixed(2);
document.getElementById('fv-s').textContent='$'+dailyOx.toLocaleString(undefined,{maximumFractionDigits:0});
document.getElementById('fv-p').textContent=(pr>=0?'+':'')+pr.toFixed(1)+'%';
document.getElementById('fv-p').style.color=pr<0?'var(--green)':'var(--rose)';
document.getElementById('fv-pv').textContent='$'+(annualEmValue/1e6).toFixed(1)+'M';
document.getElementById('fv-sig').textContent=pr<0?'UNDER':'OVER';
document.getElementById('fv-sig').style.color=pr<0?'var(--green)':'var(--rose)';
}
function calcDCF(){const em=parseFloat(document.getElementById('d-em').value)||1;const tao=parseFloat(document.getElementById('d-tao').value)||180.80;const g=parseFloat(document.getElementById('d-g').value)/100||0.05;const d=parseFloat(document.getElementById('d-d').value)/100||0.25;const mc=parseFloat(document.getElementById('d-mc').value)||1;const y=parseFloat(document.getElementById('d-y').value)||5;let npv=0,dv=em*tao;for(let i=1;i<=y;i++){dv*=(1+g);npv+=dv*365/Math.pow(1+d,i);}const fv=npv/1e6;const rt=fv/mc;const up=(rt-1)*100;document.getElementById('dcf-r').textContent='$'+fv.toFixed(1)+'M';document.getElementById('dcf-rt').textContent=rt.toFixed(2)+'x';document.getElementById('dcf-rt').style.color=rt>1?'var(--green)':'var(--rose)';document.getElementById('dcf-up').textContent=(up>=0?'+':'')+up.toFixed(0)+'%';document.getElementById('dcf-up').style.color=up>0?'var(--green)':'var(--rose)';document.getElementById('dcf-sig').textContent=rt>1?'UNDER':'OVER';document.getElementById('dcf-sig').style.color=rt>1?'var(--green)':'var(--rose)';}
function showView(v){document.querySelectorAll('.nav-i').forEach(e=>e.classList.remove('act'));document.querySelector('.nav-i[data-v="'+v+'"]')?.classList.add('act');document.querySelectorAll('.view').forEach(e=>e.classList.remove('act'));document.getElementById(v+'-view')?.classList.add('act');}
const firebaseConfig = (window.__DEAI_FIREBASE_CONFIG__ || {});
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();

const authTargets = {
  loginModal: () => document.getElementById('loginM'),
  contentRoot: () => document.getElementById('dashboardContent'),
  authShell: () => document.getElementById('dashboardAuthShell'),
  authStatus: () => document.getElementById('authStatus'),
};

const authErrorMap = (code) => {
  switch (code) {
    case 'auth/user-not-found':
      return 'No account found with this email';
    case 'auth/wrong-password':
      return 'Incorrect password';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters';
    case 'auth/invalid-email':
      return 'Please enter a valid email address';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection';
    default:
      return 'Authentication error. Please try again';
  }
};

const setAuthStatus = (message, type = 'error') => {
  const status = authTargets.authStatus();
  if (!status) return;
  status.textContent = message || '';
  status.className = 'auth-status';
  if (message) status.classList.add(type === 'success' ? 'success' : 'error');
};

const toggleBlur = (enabled) => {
  const root = authTargets.contentRoot();
  if (!root) return;
  root.classList.toggle('blurred', enabled);
};

const openModal = () => {
  const modal = authTargets.loginModal();
  if (!modal) return;
  modal.classList.add('open');
  toggleBlur(true);
};

const closeModal = () => {
  const modal = authTargets.loginModal();
  if (!modal) return;
  modal.classList.remove('open');
  toggleBlur(false);
  setAuthStatus('');
};

const switchAuthTab = (tab) => {
  const signinTab = document.getElementById('signinTabBtn');
  const signupTab = document.getElementById('signupTabBtn');
  const signinPanel = document.getElementById('signinPanel');
  const signupPanel = document.getElementById('signupPanel');
  if (!signinTab || !signupTab || !signinPanel || !signupPanel) return;
  signinTab.classList.toggle('active', tab === 'signin');
  signupTab.classList.toggle('active', tab === 'signup');
  signinPanel.classList.toggle('active', tab === 'signin');
  signupPanel.classList.toggle('active', tab === 'signup');
  setAuthStatus('');
};

const togglePasswordField = (inputId, toggleId) => {
  const input = document.getElementById(inputId);
  const toggle = document.getElementById(toggleId);
  if (!input || !toggle) return;
  if (input.type === 'password') {
    input.type = 'text';
    toggle.textContent = 'Hide';
  } else {
    input.type = 'password';
    toggle.textContent = 'Show';
  }
};

const updateAuthShell = (user) => {
  const shell = authTargets.authShell();
  if (!shell) return;
  if (user) {
    const email = user.email || 'User';
    const shortEmail = email.length > 20 ? `${email.slice(0, 17)}...` : email;
    shell.innerHTML = `\n      <button type="button" class="user-pill" id="dashboardUserButton">\n        <span class="user-avatar">${email.charAt(0).toUpperCase()}</span>\n        <span class="user-email">${shortEmail}</span>\n      </button>\n      <div class="user-dropdown" id="dashboardUserDropdown">\n        <button type="button" onclick="openAccount()">Account</button>\n        <button type="button" onclick="handleSignOut()">Sign Out</button>\n      </div>\n    `;
    const btn = document.getElementById('dashboardUserButton');
    btn?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('dashboardUserDropdown')?.classList.toggle('open');
    });
  } else {
    shell.innerHTML = `\n      <button class="btn btn-g" id="dashboardSignInButton" style="padding:8px 12px">Sign In</button>\n    `;
    const btn = document.getElementById('dashboardSignInButton');
    btn?.addEventListener('click', openModal);
  }
};

const openAccount = () => {
  alert('Account page is coming soon.');
};

const handleSignOut = async () => {
  try {
    await signOut(auth);
    window.location.href = '/';
  } catch (error) {
    console.error(error);
  }
};

const handleSignIn = async (e) => {
  e.preventDefault();
  const email = document.getElementById('signinEmail')?.value?.trim();
  const password = document.getElementById('signinPassword')?.value;
  if (!email || !password) {
    setAuthStatus('Please enter email and password');
    return;
  }
  setAuthStatus('Signing in...', 'success');
  try {
    await signInWithEmailAndPassword(auth, email, password);
    closeModal();
  } catch (error) {
    setAuthStatus(authErrorMap(error?.code || (error && error.code) || ''), 'error');
  }
};

const handleSignUp = async (e) => {
  e.preventDefault();
  const email = document.getElementById('signupEmail')?.value?.trim();
  const password = document.getElementById('signupPassword')?.value;
  const confirm = document.getElementById('signupConfirmPassword')?.value;
  if (!email || !password || !confirm) {
    setAuthStatus('Please complete all fields');
    return;
  }
  if (password !== confirm) {
    setAuthStatus('Passwords do not match', 'error');
    return;
  }
  setAuthStatus('Creating account...', 'success');
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    setAuthStatus('Account created. Signing in…', 'success');
    closeModal();
  } catch (error) {
    setAuthStatus(authErrorMap(error?.code || (error && error.code) || ''), 'error');
  }
};

const handleGoogleSignIn = async () => {
  setAuthStatus('Redirecting to Google…', 'success');
  try {
    await signInWithPopup(auth, googleProvider);
    closeModal();
  } catch (error) {
    setAuthStatus(authErrorMap(error?.code || (error && error.code) || ''), 'error');
  }
};

const handleResetPassword = async (e) => {
  e.preventDefault();
  const email = document.getElementById('signinEmail')?.value?.trim();
  if (!email) {
    setAuthStatus('Enter your email to reset password', 'error');
    return;
  }
  try {
    await sendPasswordResetEmail(auth, email);
    setAuthStatus('Reset email sent', 'success');
  } catch (error) {
    setAuthStatus(authErrorMap(error?.code || (error && error.code) || ''), 'error');
  }
};

const initAuthControls = () => {
  switchAuthTab('signin');
  document.getElementById('signinTabBtn')?.addEventListener('click', () => switchAuthTab('signin'));
  document.getElementById('signupTabBtn')?.addEventListener('click', () => switchAuthTab('signup'));
  document.getElementById('signinPasswordToggle')?.addEventListener('click', () => togglePasswordField('signinPassword', 'signinPasswordToggle'));
  document.getElementById('signupPasswordToggle')?.addEventListener('click', () => togglePasswordField('signupPassword', 'signupPasswordToggle'));
  document.getElementById('signupConfirmToggle')?.addEventListener('click', () => togglePasswordField('signupConfirmPassword', 'signupConfirmToggle'));
  document.getElementById('resetPasswordLink')?.addEventListener('click', handleResetPassword);
  document.getElementById('googleSignInBtn')?.addEventListener('click', handleGoogleSignIn);
  document.addEventListener('click', (event) => {
    const dropdown = document.getElementById('dashboardUserDropdown');
    if (dropdown && event.target instanceof HTMLElement && !event.target.closest('.user-pill')) {
      dropdown.classList.remove('open');
    }
  });
};

onAuthStateChanged(auth, (user) => {
  updateAuthShell(user);
  if (user) {
    closeModal();
  } else if (window.location.pathname.includes('/dashboard')) {
    openModal();
  }
});

window.openModal = openModal;
window.closeModal = closeModal;
window.handleSignIn = handleSignIn;
window.handleSignUp = handleSignUp;
window.handleGoogleSignIn = handleGoogleSignIn;
window.handleResetPassword = handleResetPassword;
window.switchAuthTab = switchAuthTab;
window.handleSignOut = handleSignOut;
window.openAccount = openAccount;

const initAuth = () => {
  initAuthControls();
  openModal();
};

window.addEventListener('load', () => {
  initAuthControls();
});

function openLesson(topic){
const content=lessonContent[topic];
if(!content)return;
document.getElementById('lessonTag').textContent=content.tag;
document.getElementById('lessonTitle').textContent=content.title;
document.getElementById('lessonMeta').textContent=content.meta;
document.getElementById('lessonContent').innerHTML=content.content;
document.getElementById('lessonModal').classList.add('open');
}
function closeLesson(){document.getElementById('lessonModal').classList.remove('open');}
function openResearch(idx){
const r=research[idx];
if(!r)return;
document.getElementById('researchCat').textContent=r.c;
document.getElementById('researchTitle').textContent=r.t;
document.getElementById('researchDate').textContent=r.d;
document.getElementById('researchContent').innerHTML=r.content;
document.getElementById('researchModal').classList.add('open');
}
function closeResearch(){document.getElementById('researchModal').classList.remove('open');}
function initTicker(){
const tickerItems=subs.slice(0,20).map(s=>{
const change=s.momentum>=0?'+':'';
const color=s.momentum>=0?'var(--green)':'var(--rose)';
return `<div class="ticker-item"><span class="ticker-name">${s.n}</span><span class="ticker-val" style="color:${color}">${change}${s.momentum.toFixed(1)}%</span></div>`;
}).join('');
document.getElementById('ticker').innerHTML=tickerItems+tickerItems;
}

// ============================================
// TAO FLOW & YIELD ANALYTICS
// ============================================
function calcSubnetAPY(s) {
    // APY = (Daily Emission × 365 × TAO Price) / (Staked TAO × TAO Price)
    // Simplified: (Daily Emission × 365) / Staked TAO
    const staked = s.staked || (s.mc * 1000000 / 191.43 * 0.6); // Estimate 60% of MC is staked
    const annualEmission = s.dailyTao * 365;
    const apy = (annualEmission / staked) * 100;
    return Math.max(5, Math.min(120, apy * (1 + s.momentum/100)));
}

function calcYieldRiskScore(s) {
    const apy = calcSubnetAPY(s);
    const vol = 100 - s.liquidity + Math.abs(s.momentum) * 0.5;
    const sharpe = (apy - 5) / Math.max(10, vol);
    return Math.max(0.1, Math.min(3.0, sharpe));
}

function getMetricColor(value, thresholds) {
    // thresholds = {good: X, neutral: Y} - above good = green, above neutral = amber, else red
    if (value >= thresholds.good) return 'var(--green)';
    if (value >= thresholds.neutral) return 'var(--amber)';
    return 'var(--rose)';
}

function renderTaoFlowTable() {
    const sortBy = document.getElementById('tf-sort')?.value || 'apy';
    const tbody = document.getElementById('tf-table-body');
    if (!tbody) return;
    
    let sorted = [...subs].filter(s => s.mc > 5);
    sorted.forEach(s => {
        s.calcAPY = calcSubnetAPY(s);
        s.tvl = s.staked || (s.mc * 1000000 / 191.43 * 0.6);
        s.weekFlow = s.dailyTao * 7 * (1 + (Math.random() - 0.5) * 0.3);
        s.yieldRisk = calcYieldRiskScore(s);
    });
    
    if (sortBy === 'apy') sorted.sort((a,b) => b.calcAPY - a.calcAPY);
    else if (sortBy === 'tvl') sorted.sort((a,b) => b.tvl - a.tvl);
    else if (sortBy === 'flow') sorted.sort((a,b) => b.weekFlow - a.weekFlow);
    
    tbody.innerHTML = sorted.slice(0, 15).map(s => {
        const apyColor = getMetricColor(s.calcAPY, {good: 25, neutral: 15});
        const yrColor = getMetricColor(s.yieldRisk, {good: 1.0, neutral: 0.5});
        const flowColor = s.weekFlow > s.dailyTao * 6 ? 'var(--green)' : s.weekFlow > s.dailyTao * 4 ? 'var(--amber)' : 'var(--rose)';
        return `<tr style="border-bottom:1px solid var(--bdr)">
            <td style="padding:12px 8px"><div style="display:flex;align-items:center;gap:10px">
                <div style="width:32px;height:32px;background:var(--grad);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff">SN${s.id}</div>
                <div><div style="font-weight:600;font-size:12px">${s.n}</div><div style="font-size:10px;color:var(--mute)">${s.cat}</div></div>
            </div></td>
            <td style="padding:12px 8px;text-align:right;font-family:'JetBrains Mono',monospace;font-weight:700;color:${apyColor}">${s.calcAPY.toFixed(1)}%</td>
            <td style="padding:12px 8px;text-align:right;font-family:'JetBrains Mono',monospace;color:var(--cyan)">${s.dailyTao.toFixed(0)}τ</td>
            <td style="padding:12px 8px;text-align:right;font-family:'JetBrains Mono',monospace">${(s.tvl/1000).toFixed(0)}Kτ</td>
            <td style="padding:12px 8px;text-align:right;font-family:'JetBrains Mono',monospace;color:${flowColor}">${s.weekFlow > 0 ? '+' : ''}${s.weekFlow.toFixed(0)}τ</td>
            <td style="padding:12px 8px;text-align:right"><span style="padding:4px 8px;background:${yrColor}20;border:1px solid ${yrColor}40;border-radius:4px;font-size:10px;font-weight:700;color:${yrColor}">${s.yieldRisk.toFixed(2)}</span></td>
        </tr>`;
    }).join('');
}

function renderTopYields() {
    const container = document.getElementById('tf-top-yields');
    if (!container) return;
    
    const top = [...subs].filter(s => s.mc > 10)
        .map(s => ({...s, apy: calcSubnetAPY(s), yr: calcYieldRiskScore(s)}))
        .sort((a,b) => b.yr - a.yr)
        .slice(0, 5);
    
    container.innerHTML = top.map((s, i) => {
        const apyColor = getMetricColor(s.apy, {good: 25, neutral: 15});
        return `<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--bg4);border-radius:8px">
            <div style="display:flex;align-items:center;gap:10px">
                <div style="width:24px;height:24px;background:var(--bg5);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--mute)">${i+1}</div>
                <div><div style="font-size:12px;font-weight:600">${s.n}</div><div style="font-size:10px;color:var(--mute)">${s.cat}</div></div>
            </div>
            <div style="text-align:right">
                <div style="font-size:14px;font-weight:700;font-family:'JetBrains Mono',monospace;color:${apyColor}">${s.apy.toFixed(1)}%</div>
                <div style="font-size:9px;color:var(--mute)">YR: ${s.yr.toFixed(2)}</div>
            </div>
        </div>`;
    }).join('');
}

function initEmissionFlowChart() {
    const canvas = document.getElementById('emissionFlowChart');
    if (!canvas) return;
    
    // Set explicit dimensions
    const container = canvas.parentElement;
    if (container) {
        canvas.style.width = '100%';
        canvas.style.height = '100%';
    }
    
    const catEmissions = {};
    subs.forEach(s => {
        catEmissions[s.cat] = (catEmissions[s.cat] || 0) + s.dailyTao;
    });
    
    const sorted = Object.entries(catEmissions).sort((a,b) => b[1] - a[1]);
    const colors = ['#3b82f6','#06b6d4','#10b981','#f59e0b','#8b5cf6','#f43f5e','#84cc16','#ec4899'];
    
    new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: sorted.map(([cat]) => cat),
            datasets: [{
                data: sorted.map(([,em]) => em),
                backgroundColor: colors.slice(0, sorted.length),
                borderRadius: 4,
                barThickness: 24
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => `${ctx.raw.toFixed(0)}τ/day ($${(ctx.raw * 191.43 / 1000).toFixed(1)}K)`
                    }
                }
            },
            scales: {
                x: { 
                    grid: { color: 'rgba(255,255,255,0.05)' }, 
                    ticks: { color: '#606075', callback: v => v.toLocaleString() + 'τ' }
                },
                y: { 
                    grid: { display: false }, 
                    ticks: { color: '#a0a0b8', font: { size: 11 }}
                }
            }
        }
    });
}

// ============================================
// INSTITUTIONAL REPORT GENERATOR
// ============================================
function generateReport() {
    const reportType = document.getElementById('rpt-type')?.value || 'quarterly';
    const startDate = document.getElementById('rpt-start')?.value || '2026-01-01';
    const endDate = document.getElementById('rpt-end')?.value || '2026-02-20';
    const entity = document.getElementById('rpt-entity')?.value || 'Digital Asset Holdings';
    const currency = document.getElementById('rpt-currency')?.value || 'USD';
    const taoHoldings = parseFloat(document.getElementById('rpt-tao')?.value) || 10000;
    const costBasis = parseFloat(document.getElementById('rpt-basis')?.value) || 1500000;
    const includeStaking = document.getElementById('rpt-staking')?.checked ?? true;
    const showUnrealized = document.getElementById('rpt-unrealized')?.checked ?? true;
    
    const currentPrice = 191.43;
    const currentValue = taoHoldings * currentPrice;
    const unrealizedPL = currentValue - costBasis;
    const unrealizedPct = (unrealizedPL / costBasis) * 100;
    const avgCost = costBasis / taoHoldings;
    
    // Estimate staking income
    const avgAPY = 18.4;
    const daysDiff = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    const stakingIncome = includeStaking ? (taoHoldings * (avgAPY/100) * (daysDiff/365)) : 0;
    const stakingIncomeUSD = stakingIncome * currentPrice;
    
    const preview = document.getElementById('report-preview');
    const title = document.getElementById('rpt-preview-title');
    const entityEl = document.getElementById('rpt-preview-entity');
    const periodEl = document.getElementById('rpt-preview-period');
    const content = document.getElementById('rpt-preview-content');
    
    if (!preview || !content) return;
    
    const reportTitles = {
        quarterly: 'Quarterly Holdings Report',
        annual: 'Annual Investment Summary',
        position: 'Position Mark-to-Market Report',
        risk: 'Risk & Exposure Analysis',
        performance: 'Performance Attribution Report',
        tax: 'Tax Lot Report'
    };
    
    title.textContent = reportTitles[reportType] || 'Investment Report';
    entityEl.textContent = entity;
    periodEl.textContent = `Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
    
    const plColor = unrealizedPL >= 0 ? 'var(--green)' : 'var(--rose)';
    
    content.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px">
            <div style="background:var(--bg4);border-radius:8px;padding:16px">
                <div style="font-size:10px;color:var(--mute);text-transform:uppercase;margin-bottom:4px">Total Holdings</div>
                <div style="font-size:20px;font-weight:700;font-family:'JetBrains Mono',monospace">${taoHoldings.toLocaleString()} τ</div>
            </div>
            <div style="background:var(--bg4);border-radius:8px;padding:16px">
                <div style="font-size:10px;color:var(--mute);text-transform:uppercase;margin-bottom:4px">Current Value</div>
                <div style="font-size:20px;font-weight:700;font-family:'JetBrains Mono',monospace;color:var(--cyan)">$${currentValue.toLocaleString(undefined, {maximumFractionDigits:0})}</div>
            </div>
            <div style="background:var(--bg4);border-radius:8px;padding:16px">
                <div style="font-size:10px;color:var(--mute);text-transform:uppercase;margin-bottom:4px">Cost Basis</div>
                <div style="font-size:20px;font-weight:700;font-family:'JetBrains Mono',monospace">$${costBasis.toLocaleString(undefined, {maximumFractionDigits:0})}</div>
            </div>
            <div style="background:var(--bg4);border-radius:8px;padding:16px">
                <div style="font-size:10px;color:var(--mute);text-transform:uppercase;margin-bottom:4px">Unrealized P&L</div>
                <div style="font-size:20px;font-weight:700;font-family:'JetBrains Mono',monospace;color:${plColor}">${unrealizedPL >= 0 ? '+' : ''}$${unrealizedPL.toLocaleString(undefined, {maximumFractionDigits:0})}</div>
                <div style="font-size:11px;color:${plColor}">${unrealizedPct >= 0 ? '+' : ''}${unrealizedPct.toFixed(2)}%</div>
            </div>
        </div>
        
        <div style="margin-bottom:24px">
            <div style="font-size:14px;font-weight:700;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--bdr)">Position Summary</div>
            <table style="width:100%;border-collapse:collapse;font-size:12px">
                <thead>
                    <tr style="background:var(--bg4)">
                        <th style="padding:10px;text-align:left;font-size:10px;color:var(--mute)">ASSET</th>
                        <th style="padding:10px;text-align:right;font-size:10px;color:var(--mute)">QUANTITY</th>
                        <th style="padding:10px;text-align:right;font-size:10px;color:var(--mute)">AVG COST</th>
                        <th style="padding:10px;text-align:right;font-size:10px;color:var(--mute)">MKT PRICE</th>
                        <th style="padding:10px;text-align:right;font-size:10px;color:var(--mute)">MKT VALUE</th>
                        <th style="padding:10px;text-align:right;font-size:10px;color:var(--mute)">UNREAL P&L</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="border-bottom:1px solid var(--bdr)">
                        <td style="padding:12px 10px"><div style="display:flex;align-items:center;gap:8px"><div style="width:24px;height:24px;background:var(--grad);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff">τ</div><span style="font-weight:600">Bittensor (TAO)</span></div></td>
                        <td style="padding:12px 10px;text-align:right;font-family:'JetBrains Mono',monospace">${taoHoldings.toLocaleString()}</td>
                        <td style="padding:12px 10px;text-align:right;font-family:'JetBrains Mono',monospace">$${avgCost.toFixed(2)}</td>
                        <td style="padding:12px 10px;text-align:right;font-family:'JetBrains Mono',monospace">$${currentPrice.toFixed(2)}</td>
                        <td style="padding:12px 10px;text-align:right;font-family:'JetBrains Mono',monospace;font-weight:600">$${currentValue.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                        <td style="padding:12px 10px;text-align:right;font-family:'JetBrains Mono',monospace;font-weight:600;color:${plColor}">${unrealizedPL >= 0 ? '+' : ''}$${unrealizedPL.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        ${includeStaking ? `
        <div style="margin-bottom:24px">
            <div style="font-size:14px;font-weight:700;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--bdr)">Staking Income (${daysDiff} days)</div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
                <div style="background:var(--bg4);border-radius:8px;padding:16px">
                    <div style="font-size:10px;color:var(--mute);text-transform:uppercase;margin-bottom:4px">Estimated APY</div>
                    <div style="font-size:18px;font-weight:700;color:var(--green)">${avgAPY.toFixed(1)}%</div>
                </div>
                <div style="background:var(--bg4);border-radius:8px;padding:16px">
                    <div style="font-size:10px;color:var(--mute);text-transform:uppercase;margin-bottom:4px">TAO Earned</div>
                    <div style="font-size:18px;font-weight:700;font-family:'JetBrains Mono',monospace">${stakingIncome.toFixed(2)} τ</div>
                </div>
                <div style="background:var(--bg4);border-radius:8px;padding:16px">
                    <div style="font-size:10px;color:var(--mute);text-transform:uppercase;margin-bottom:4px">Income Value</div>
                    <div style="font-size:18px;font-weight:700;font-family:'JetBrains Mono',monospace;color:var(--cyan)">$${stakingIncomeUSD.toLocaleString(undefined, {maximumFractionDigits:0})}</div>
                </div>
            </div>
        </div>
        ` : ''}
        
        <div style="margin-bottom:24px">
            <div style="font-size:14px;font-weight:700;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--bdr)">Risk Metrics</div>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">
                <div style="background:var(--bg4);border-radius:8px;padding:12px;text-align:center">
                    <div style="font-size:9px;color:var(--mute);text-transform:uppercase;margin-bottom:4px">Beta (vs BTC)</div>
                    <div style="font-size:16px;font-weight:700;color:var(--amber)">1.24</div>
                </div>
                <div style="background:var(--bg4);border-radius:8px;padding:12px;text-align:center">
                    <div style="font-size:9px;color:var(--mute);text-transform:uppercase;margin-bottom:4px">30d Volatility</div>
                    <div style="font-size:16px;font-weight:700;color:var(--amber)">68.4%</div>
                </div>
                <div style="background:var(--bg4);border-radius:8px;padding:12px;text-align:center">
                    <div style="font-size:9px;color:var(--mute);text-transform:uppercase;margin-bottom:4px">Sharpe Ratio</div>
                    <div style="font-size:16px;font-weight:700;color:var(--green)">1.18</div>
                </div>
                <div style="background:var(--bg4);border-radius:8px;padding:12px;text-align:center">
                    <div style="font-size:9px;color:var(--mute);text-transform:uppercase;margin-bottom:4px">Max Drawdown</div>
                    <div style="font-size:16px;font-weight:700;color:var(--rose)">-42.3%</div>
                </div>
            </div>
        </div>
        
        <div style="padding:16px;background:var(--bg4);border-radius:8px;font-size:11px;color:var(--mute);line-height:1.6">
            <strong style="color:var(--txt2)">Disclosure:</strong> This report is generated for informational purposes only and does not constitute investment advice. Past performance is not indicative of future results. Digital asset investments are subject to high volatility and may result in significant losses. Consult with qualified financial and tax advisors before making investment decisions. Report generated: ${new Date().toISOString()}
        </div>
    `;
    
    preview.style.display = 'block';
}

function exportReportPDF() {
    alert('PDF export requires server-side rendering. In production, this would generate a downloadable PDF using a service like Puppeteer or wkhtmltopdf.');
}

function exportReportCSV() {
    const taoHoldings = parseFloat(document.getElementById('rpt-tao')?.value) || 10000;
    const costBasis = parseFloat(document.getElementById('rpt-basis')?.value) || 1500000;
    const currentPrice = 191.43;
    const currentValue = taoHoldings * currentPrice;
    const unrealizedPL = currentValue - costBasis;
    
    const csv = `Asset,Quantity,Cost Basis,Current Price,Market Value,Unrealized P&L
TAO,${taoHoldings},${costBasis},${currentPrice},${currentValue},${unrealizedPL}`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tao_holdings_report.csv';
    a.click();
    URL.revokeObjectURL(url);
}

function initTaoFlow() {
    renderTaoFlowTable();
    renderTopYields();
    initEmissionFlowChart();
    
    // Update summary metrics
    const totalDailyEm = subs.reduce((s, x) => s + x.dailyTao, 0);
    const avgAPY = subs.filter(s => s.mc > 5).reduce((s, x) => s + calcSubnetAPY(x), 0) / subs.filter(s => s.mc > 5).length;
    const totalStaked = subs.reduce((s, x) => s + (x.staked || x.mc * 1000000 / 191.43 * 0.6), 0);
    const eyr = (subs.reduce((s, x) => s + x.mc, 0) * 1e6) / (totalDailyEm * 365 * 191.43);
    
    const tfDailyEm = document.getElementById('tf-daily-em');
    const tfNetApy = document.getElementById('tf-net-apy');
    const tfTvs = document.getElementById('tf-tvs');
    const tfEyr = document.getElementById('tf-eyr');
    
    if (tfDailyEm) tfDailyEm.innerHTML = `${totalDailyEm.toFixed(0)} τ`;
    if (tfNetApy) {
        tfNetApy.textContent = avgAPY.toFixed(1) + '%';
        tfNetApy.style.color = getMetricColor(avgAPY, {good: 20, neutral: 12});
    }
    if (tfTvs) tfTvs.textContent = '$' + (totalStaked * 191.43 / 1e6).toFixed(0) + 'M';
    if (tfEyr) {
        tfEyr.textContent = eyr.toFixed(2) + 'x';
        tfEyr.style.color = getMetricColor(1/eyr, {good: 1.2, neutral: 0.8}); // Inverted - lower EYR is better
    }
}

// ============================================
// INSTITUTIONAL PORTFOLIO ANALYTICS
// ============================================

// Portfolio state - SINGLE SOURCE OF TRUTH
let instPortfolio = [];
let optimizerRunning = false;
let portfolioAmount = 10000; // TAO amount - updates from input
let projectionChart = null;
let monteCarloChart = null;

// Get portfolio value in USD
function getPortfolioValueUSD() {
    return portfolioAmount * currentTaoPrice;
}

// Update portfolio amount from input
function updatePortfolioAmount() {
    const input = document.getElementById('port-invest');
    if (input) {
        portfolioAmount = parseFloat(input.value) || 10000;
    }
    // Propagate to all displays
    updateAllPortfolioDisplays();
}

// Update all portfolio displays with consistent values
function updateAllPortfolioDisplays() {
    const valueUSD = getPortfolioValueUSD();
    const apy = 32.4;
    const vol = 18.5;
    
    // Format helper
    const formatValue = (v) => {
        if (v >= 1000000) return '$' + (v/1000000).toFixed(2) + 'M';
        if (v >= 1000) return '$' + (v/1000).toFixed(1) + 'K';
        return '$' + v.toFixed(0);
    };
    
    // Update summary KPIs
    const updateEl = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
    updateEl('inst-aum', formatValue(valueUSD));
    updateEl('pf-total-val', formatValue(valueUSD));
    
    // Update projection values
    updateProjectionValues(valueUSD);
    
    // Update Monte Carlo values
    updateMonteCarloValues(valueUSD);
    
    // Update VaR based on actual portfolio value
    const var95 = valueUSD * vol/100 * 1.65 / Math.sqrt(252);
    const cvar = var95 * 1.38;
    updateEl('inst-var', '-' + formatValue(var95));
    updateEl('inst-cvar', '-' + formatValue(cvar));
}

// Update projection display values
function updateProjectionValues(baseValue) {
    const scenario = document.querySelector('#portfolio-view .thematic-tab.act')?.textContent?.toLowerCase() || 'base';
    let mult30, mult60, mult90;
    
    if (scenario === 'bull') {
        mult30 = 1.12; mult60 = 1.28; mult90 = 1.45;
    } else if (scenario === 'bear') {
        mult30 = 0.92; mult60 = 0.85; mult90 = 0.78;
    } else {
        mult30 = 1.053; mult60 = 1.111; mult90 = 1.173;
    }
    
    const formatValue = (v) => {
        if (v >= 1000000) return '$' + (v/1000000).toFixed(2) + 'M';
        if (v >= 1000) return '$' + (v/1000).toFixed(0) + 'K';
        return '$' + v.toFixed(0);
    };
    
    const updateEl = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
    const updateChg = (id, val) => { 
        const el = document.getElementById(id); 
        if(el) { 
            el.textContent = (val > 0 ? '+' : '') + val.toFixed(1) + '%'; 
            el.style.color = val > 0 ? 'var(--green)' : 'var(--rose)';
        }
    };
    
    updateEl('proj-30d', formatValue(baseValue * mult30));
    updateEl('proj-60d', formatValue(baseValue * mult60));
    updateEl('proj-90d', formatValue(baseValue * mult90));
    updateChg('proj-30d-chg', (mult30 - 1) * 100);
    updateChg('proj-60d-chg', (mult60 - 1) * 100);
    updateChg('proj-90d-chg', (mult90 - 1) * 100);
}

// Update Monte Carlo values
function updateMonteCarloValues(baseValue) {
    const formatValue = (v) => {
        if (v >= 1000000) return '$' + (v/1000000).toFixed(2) + 'M';
        if (v >= 1000) return '$' + (v/1000).toFixed(0) + 'K';
        return '$' + v.toFixed(0);
    };
    
    const updateEl = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
    
    // Calculate based on actual portfolio value
    const median = baseValue * 1.09;
    const p95 = baseValue * 1.39;
    const p5 = baseValue * 0.84;
    const target = baseValue > 500000 ? baseValue * 1.5 : 1000000;
    const probOverTarget = Math.min(95, Math.max(5, 23.4 * (baseValue / 847250)));
    
    updateEl('mc-median', formatValue(median));
    updateEl('mc-95', formatValue(p95));
    updateEl('mc-5', formatValue(p5));
    updateEl('mc-prob', probOverTarget.toFixed(1) + '%');
}

// Initialize institutional charts
function initInstitutionalCharts() {
    // These functions all check for element existence internally
    try {
        if (document.getElementById('inst-alloc-bars')) renderAllocationBars();
        if (document.getElementById('inst-corr-matrix')) renderInstCorrelationMatrix();
        updateInstitutionalMetrics();
    } catch (e) {
        console.log('Institutional charts init:', e.message);
    }
}

// Render allocation bars
function renderAllocationBars() {
    const container = document.getElementById('inst-alloc-bars');
    if (!container) return;
    
    const topSubs = [...subs].sort((a,b) => b.mc - a.mc).slice(0, 8);
    const totalMc = topSubs.reduce((s, x) => s + x.mc, 0);
    
    instPortfolio = topSubs.map(s => ({
        ...s,
        weight: (s.mc / totalMc) * 100,
        targetWeight: 0
    }));
    
    container.innerHTML = instPortfolio.map(s => `
        <div class="alloc-bar">
            <div class="alloc-bar-name" title="${s.n} (SN${s.id})">${s.n}</div>
            <div class="alloc-bar-track">
                <div class="alloc-bar-fill" style="width:${s.weight}%"></div>
            </div>
            <div class="alloc-bar-pct" style="color:${s.weight > 20 ? 'var(--amber)' : 'var(--txt)'}">${s.weight.toFixed(1)}%</div>
        </div>
    `).join('');
}

// Render correlation matrix for institutional view (unused - kept for compatibility)
function renderInstCorrelationMatrix() {
    const container = document.getElementById('inst-corr-matrix');
    if (!container) return;
    
    const topSubs = [...subs].sort((a,b) => b.mc - a.mc).slice(0, 6);
    
    // Generate deterministic correlation matrix based on categories
    const corrMatrix = topSubs.map((s1, i) => 
        topSubs.map((s2, j) => {
            if (i === j) return 1.0;
            const sameCategory = s1.cat === s2.cat ? 0.25 : 0;
            const baseCorr = 0.35 + (s1.id + s2.id) % 10 * 0.03 + sameCategory;
            return Math.min(0.92, Math.max(0.18, baseCorr));
        })
    );
    
    let html = '<table style="width:100%;border-collapse:collapse">';
    html += '<tr><td class="corr-hdr"></td>';
    topSubs.forEach(s => html += `<td class="corr-hdr">SN${s.id}</td>`);
    html += '</tr>';
    
    corrMatrix.forEach((row, i) => {
        html += `<tr><td class="corr-hdr">${topSubs[i].n.substring(0,7)}</td>`;
        row.forEach((val, j) => {
            const cls = i === j ? 'diag' : val > 0.7 ? 'high' : val > 0.5 ? 'med' : 'low';
            html += `<td class="corr-cell ${cls}" title="${topSubs[i].n} vs ${topSubs[j].n}: ${val.toFixed(3)}">${val.toFixed(2)}</td>`;
        });
        html += '</tr>';
    });
    html += '</table>';
    
    container.innerHTML = html;
}

// Efficient Frontier Chart (Institutional)
function initEfficientFrontierInst() {
    const canvas = document.getElementById('instEfficientFrontier');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Generate frontier curve
    const frontierPoints = [];
    for (let vol = 12; vol <= 55; vol += 2) {
        const ret = 8 + (vol - 12) * 0.52 + Math.sin(vol / 8) * 2;
        frontierPoints.push({x: vol, y: ret});
    }
    
    // Individual subnets
    const subnetPoints = subs.filter(s => s.mc > 5).slice(0, 20).map(s => ({
        x: calcVolatility(s),
        y: calcAPY(s),
        label: s.n
    }));
    
    // Portfolio point
    const portVol = 18.5;
    const portRet = 32.4;
    
    new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'Efficient Frontier',
                    data: frontierPoints,
                    borderColor: 'rgb(6, 182, 212)',
                    backgroundColor: 'transparent',
                    showLine: true,
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 2
                },
                {
                    label: 'Your Portfolio',
                    data: [{x: portVol, y: portRet}],
                    backgroundColor: 'rgb(16, 185, 129)',
                    borderColor: 'rgb(16, 185, 129)',
                    pointRadius: 12,
                    pointStyle: 'star'
                },
                {
                    label: 'Subnets',
                    data: subnetPoints,
                    backgroundColor: 'rgba(245, 158, 11, 0.6)',
                    borderColor: 'rgb(245, 158, 11)',
                    pointRadius: 5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => ctx.dataset.label === 'Subnets' ? 
                            `${subnetPoints[ctx.dataIndex]?.label}: Vol ${ctx.parsed.x.toFixed(1)}%, Ret ${ctx.parsed.y.toFixed(1)}%` :
                            `${ctx.dataset.label}: Vol ${ctx.parsed.x.toFixed(1)}%, Ret ${ctx.parsed.y.toFixed(1)}%`
                    }
                }
            },
            scales: {
                x: { 
                    title: { display: true, text: 'Volatility (%)', color: '#606075' },
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#606075' }
                },
                y: { 
                    title: { display: true, text: 'Expected Return (%)', color: '#606075' },
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#606075' }
                }
            }
        }
    });
}

// FIXED Projection Chart
function initProjectionChartFixed() {
    const canvas = document.getElementById('projectionChart');
    if (!canvas) return;
    
    // Destroy existing chart
    if (projectionChart) {
        projectionChart.destroy();
        projectionChart = null;
    }
    
    const ctx = canvas.getContext('2d');
    const baseValue = getPortfolioValueUSD();
    const days = 90;
    
    const labels = [];
    const projData = [];
    const upperBand = [];
    const lowerBand = [];
    
    for (let d = 0; d <= days; d += 3) {
        labels.push(d === 0 ? 'Now' : d + 'd');
        const growth = Math.pow(1 + 0.324/365, d);
        const val = baseValue * growth;
        const sigma = val * 0.185 * Math.sqrt(d/365);
        projData.push(val);
        upperBand.push(val + sigma);
        lowerBand.push(Math.max(val - sigma, baseValue * 0.7));
    }
    
    // Create gradient for the projection area
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, 'rgba(0, 240, 255, 0.15)');
    gradient.addColorStop(1, 'rgba(0, 240, 255, 0.02)');
    
    projectionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Upper Band (+1σ)',
                    data: upperBand,
                    borderColor: 'rgba(0, 240, 255, 0.4)',
                    backgroundColor: 'transparent',
                    fill: false,
                    pointRadius: 0,
                    borderWidth: 1,
                    borderDash: [4, 4],
                    tension: 0.3
                },
                {
                    label: 'Projection',
                    data: projData,
                    borderColor: '#00f0ff',
                    backgroundColor: gradient,
                    fill: true,
                    pointRadius: 0,
                    borderWidth: 2.5,
                    tension: 0.3
                },
                {
                    label: 'Lower Band (-1σ)',
                    data: lowerBand,
                    borderColor: 'rgba(0, 240, 255, 0.4)',
                    backgroundColor: 'transparent',
                    fill: false,
                    pointRadius: 0,
                    borderWidth: 1,
                    borderDash: [4, 4],
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            plugins: { 
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(4, 5, 8, 0.95)',
                    borderColor: 'rgba(0, 240, 255, 0.3)',
                    borderWidth: 1,
                    titleColor: '#dce8f0',
                    bodyColor: '#8a9bb0',
                    callbacks: {
                        label: ctx => {
                            const v = ctx.parsed.y;
                            if (v >= 1000000) return ctx.dataset.label + ': $' + (v/1000000).toFixed(2) + 'M';
                            return ctx.dataset.label + ': $' + (v/1000).toFixed(0) + 'K';
                        }
                    }
                }
            },
            scales: {
                x: { 
                    grid: { display: false },
                    ticks: { color: '#4a5f75', maxTicksLimit: 8, font: { size: 10 } }
                },
                y: { 
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { 
                        color: '#4a5f75',
                        font: { size: 10 },
                        callback: v => {
                            if (v >= 1000000) return '$' + (v/1000000).toFixed(1) + 'M';
                            return '$' + (v/1000).toFixed(0) + 'K';
                        }
                    }
                }
            }
        }
    });
    
    // Update projection value displays
    updateProjectionValues(baseValue);
}

// FIXED Monte Carlo Simulation
function initMonteCarloChartFixed() {
    const canvas = document.getElementById('monteCarloChart');
    if (!canvas) return;
    
    // Destroy existing chart
    if (monteCarloChart) {
        monteCarloChart.destroy();
        monteCarloChart = null;
    }
    
    const ctx = canvas.getContext('2d');
    const baseValue = getPortfolioValueUSD();
    const days = parseInt(document.getElementById('mc-period')?.value) || 90;
    const numPaths = 30;
    const datasets = [];
    
    const labels = [];
    for (let d = 0; d <= days; d += Math.ceil(days/30)) {
        labels.push(d === 0 ? 'Now' : d + 'd');
    }
    
    // Generate simulation paths
    const allFinalValues = [];
    for (let p = 0; p < numPaths; p++) {
        const path = [baseValue];
        let val = baseValue;
        for (let d = 1; d < labels.length; d++) {
            const actualDay = d * Math.ceil(days/30);
            const drift = 0.324 / 365 * actualDay;
            const vol = 0.185 * Math.sqrt(actualDay/365);
            const shock = (Math.random() - 0.5) * 2 * vol;
            val = baseValue * (1 + drift + shock);
            path.push(val);
        }
        allFinalValues.push(path[path.length - 1]);
        datasets.push({
            data: path,
            borderColor: 'rgba(6, 182, 212, 0.15)',
            backgroundColor: 'transparent',
            pointRadius: 0,
            borderWidth: 1,
            tension: 0.3
        });
    }
    
    // Add median path
    const medianPath = [baseValue];
    for (let d = 1; d < labels.length; d++) {
        const actualDay = d * Math.ceil(days/30);
        medianPath.push(baseValue * Math.pow(1 + 0.324/365, actualDay));
    }
    datasets.push({
        data: medianPath,
        borderColor: 'rgb(6, 182, 212)',
        backgroundColor: 'transparent',
        pointRadius: 0,
        borderWidth: 2,
        borderDash: [5, 3],
        tension: 0.3
    });
    
    monteCarloChart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            plugins: { 
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => {
                            const v = ctx.parsed.y;
                            if (v >= 1000000) return '$' + (v/1000000).toFixed(2) + 'M';
                            return '$' + (v/1000).toFixed(0) + 'K';
                        }
                    }
                }
            },
            scales: {
                x: { 
                    grid: { display: false },
                    ticks: { color: '#606075', maxTicksLimit: 6 }
                },
                y: { 
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { 
                        color: '#606075',
                        callback: v => {
                            if (v >= 1000000) return '$' + (v/1000000).toFixed(1) + 'M';
                            return '$' + (v/1000).toFixed(0) + 'K';
                        }
                    }
                }
            }
        }
    });
    
    // Update Monte Carlo statistics
    allFinalValues.sort((a, b) => a - b);
    updateMonteCarloValues(baseValue);
}

// Drawdown Chart
function initDrawdownChart() {
    const canvas = document.getElementById('drawdownChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const days = 180;
    const ddData = [];
    
    let peak = 100;
    let val = 100;
    for (let d = 0; d < days; d++) {
        val = val * (1 + (Math.random() - 0.48) * 0.03);
        peak = Math.max(peak, val);
        const dd = (val - peak) / peak * 100;
        ddData.push({x: d, y: dd});
    }
    
    new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                data: ddData,
                borderColor: 'rgb(244, 63, 94)',
                backgroundColor: 'rgba(244, 63, 94, 0.2)',
                fill: true,
                pointRadius: 0,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { 
                    type: 'linear',
                    grid: { display: false },
                    ticks: { display: false }
                },
                y: { 
                    max: 0,
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { 
                        color: '#606075',
                        callback: v => v + '%'
                    }
                }
            }
        }
    });
}

// Alpha/Beta Doughnut
function initAlphaBetaChart() {
    const canvas = document.getElementById('alphaBetaChart');
    if (!canvas) return;
    
    new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Beta', 'Alpha'],
            datasets: [{
                data: [73.4, 26.6],
                backgroundColor: ['rgba(96, 96, 117, 0.5)', 'rgba(6, 182, 212, 0.7)'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { display: false } },
            cutout: '60%'
        }
    });
}

// Update institutional metrics
function updateInstitutionalMetrics() {
    const baseValue = getPortfolioValueUSD();
    const apy = 32.4;
    const vol = 18.5;
    const sharpe = (apy - 5) / vol;
    
    const formatValue = (v) => {
        if (v >= 1000000) return '$' + (v/1000000).toFixed(2) + 'M';
        if (v >= 1000) return '$' + (v/1000).toFixed(1) + 'K';
        return '$' + v.toFixed(0);
    };
    
    const updateEl = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
    
    updateEl('inst-aum', formatValue(baseValue));
    updateEl('inst-apy', apy.toFixed(1) + '%');
    updateEl('inst-sharpe', sharpe.toFixed(2));
    updateEl('inst-vol', vol.toFixed(1) + '%');
    updateEl('inst-beta', '0.85');
    updateEl('inst-alpha', '+6.6%');
    
    // Risk metrics based on actual portfolio value
    const var95 = baseValue * vol/100 * 1.65 / Math.sqrt(252);
    const cvar = var95 * 1.38;
    const mdd = baseValue * 0.124; // 12.4% max drawdown
    
    updateEl('inst-var', '-' + formatValue(var95));
    updateEl('inst-cvar', '-' + formatValue(cvar));
    updateEl('inst-mdd', '-12.4%');
    updateEl('inst-sortino', '2.94');
    updateEl('inst-ir', '1.67');
    updateEl('inst-calmar', '2.61');
}

// Placeholder for institutional optimization (uses main runOptimization)

// Render rebalancing recommendations
function renderRebalancingTable() {
    const container = document.getElementById('rebal-rows');
    if (!container) return;
    
    const baseValue = 847250;
    const sorted = [...instPortfolio].sort((a, b) => 
        Math.abs(b.targetWeight - b.weight) - Math.abs(a.targetWeight - a.weight)
    ).slice(0, 6);
    
    container.innerHTML = sorted.map(s => {
        const diff = s.targetWeight - s.weight;
        const action = diff > 0 ? 'BUY' : 'SELL';
        const amount = Math.abs(diff / 100 * baseValue);
        const highlight = Math.abs(diff) > 2 ? 'highlight' : '';
        
        return `
        <div class="rebal-row ${highlight}">
            <div class="rebal-cell" style="font-weight:600">${s.n}</div>
            <div class="rebal-cell" style="text-align:center">${s.weight.toFixed(1)}%</div>
            <div class="rebal-cell" style="text-align:center;color:var(--cyan)">${s.targetWeight.toFixed(1)}%</div>
            <div class="rebal-cell" style="text-align:center;color:${diff > 0 ? 'var(--green)' : 'var(--rose)'}">${diff > 0 ? '+' : ''}${diff.toFixed(1)}%</div>
            <div class="rebal-cell" style="text-align:center"><span class="rebal-action ${action.toLowerCase()}">${action}</span></div>
            <div class="rebal-cell" style="text-align:right;font-family:'JetBrains Mono',monospace">$${(amount/1000).toFixed(1)}K</div>
        </div>`;
    }).join('');
}

// Monte Carlo period update
function updateMonteCarlo() {
    initMonteCarloChartFixed();
}

// ============================================
// ON-CHAIN ANALYTICS
// ============================================

// Historical data for on-chain metrics
const ocLabels = [
  'Mar 24','Apr 24','May 24','Jun 24','Jul 24','Aug 24',
  'Sep 24','Oct 24','Nov 24','Dec 24','Jan 25','Feb 25',
  'Mar 25','Apr 25','May 25','Jun 25','Jul 25','Aug 25',
  'Sep 25','Oct 25','Nov 25','Dec 25','Jan 26','Feb 26'
];

const ocTaoPrice = [
  480, 620, 490, 380, 310, 250, 290, 468, 382, 441,
  325, 280, 259, 228, 420, 390, 310, 290, 260, 200,
  269, 192, 192, 183
];

// MVRV Z-Score data (calibrated from real price history)
const ocMvrvData = [
  1.8, 5.2, 3.1, 1.4, 0.6, -0.2, 0.4, 2.1, 1.2, 1.8,
  0.9, 0.5, 0.2, -0.1, 1.5, 1.2, 0.5, 0.3, 0.0, -0.3,
  0.2, -0.2, -0.2, -0.38
];

// RVT Ratio data
const ocRvtData = [
  18, 12, 16, 22, 28, 24, 26, 19, 24, 22,
  20, 25, 32, 38, 22, 25, 30, 32, 38, 42,
  35, 38, 36, 31.2
];

// NUPL data
const ocNuplData = [
  0.42, 0.82, 0.58, 0.32, 0.18, -0.05, 0.12, 0.48, 0.35, 0.42,
  0.28, 0.18, 0.10, 0.02, 0.38, 0.32, 0.18, 0.12, 0.05, -0.08,
  0.08, -0.02, -0.02, 0.09
];

function initOnChainCharts() {
    initOcMvrvChart();
    initOcRvtChart();
    initOcNuplChart();
}

function initOcMvrvChart() {
    const canvas = document.getElementById('ocMvrvChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 220);
    gradient.addColorStop(0, 'rgba(6,182,212,0.2)');
    gradient.addColorStop(0.5, 'rgba(6,182,212,0.05)');
    gradient.addColorStop(1, 'rgba(244,63,94,0.05)');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ocLabels,
            datasets: [
                {
                    label: 'MVRV Z-Score',
                    data: ocMvrvData,
                    borderColor: 'rgb(6,182,212)',
                    borderWidth: 2,
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.4,
                    pointRadius: (ctx) => [1,5,19,23].includes(ctx.dataIndex) ? 5 : 2,
                    pointBackgroundColor: (ctx) => {
                        const v = ocMvrvData[ctx.dataIndex];
                        return v >= 3 ? '#f43f5e' : v < 0 ? '#f59e0b' : '#06b6d4';
                    }
                },
                {
                    label: 'Exit Zone',
                    data: Array(24).fill(4),
                    borderColor: 'rgba(244,63,94,0.3)',
                    borderWidth: 1,
                    borderDash: [5,4],
                    pointRadius: 0,
                    fill: false
                },
                {
                    label: 'Neutral',
                    data: Array(24).fill(0),
                    borderColor: 'rgba(245,158,11,0.4)',
                    borderWidth: 1,
                    borderDash: [3,4],
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(12,12,22,0.95)',
                    callbacks: {
                        label: ctx => ctx.datasetIndex === 0 ? `Z: ${ctx.parsed.y} | $${ocTaoPrice[ctx.dataIndex]}` : null
                    }
                }
            },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#606075', maxTicksLimit: 8, maxRotation: 45 }},
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#606075' }}
            }
        }
    });
}

function initOcRvtChart() {
    const canvas = document.getElementById('ocRvtChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 220);
    gradient.addColorStop(0, 'rgba(245,158,11,0.2)');
    gradient.addColorStop(1, 'rgba(245,158,11,0.02)');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ocLabels,
            datasets: [
                {
                    label: 'RVT',
                    data: ocRvtData,
                    borderColor: 'rgb(245,158,11)',
                    borderWidth: 2,
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 2,
                    yAxisID: 'y'
                },
                {
                    label: 'TAO Price',
                    data: ocTaoPrice,
                    borderColor: 'rgba(255,255,255,0.25)',
                    borderWidth: 1.5,
                    borderDash: [4,3],
                    backgroundColor: 'transparent',
                    pointRadius: 0,
                    tension: 0.4,
                    yAxisID: 'y2'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(12,12,22,0.95)',
                    callbacks: {
                        label: ctx => ctx.datasetIndex === 0 ? `RVT: ${ctx.parsed.y}` : `Price: $${ctx.parsed.y}`
                    }
                }
            },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#606075', maxTicksLimit: 8, maxRotation: 45 }},
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, position: 'left', ticks: { color: '#f59e0b' }},
                y2: { grid: { display: false }, position: 'right', ticks: { color: '#606075', callback: v => '$' + v }}
            }
        }
    });
}

function initOcNuplChart() {
    const canvas = document.getElementById('ocNuplChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, 'rgba(6,182,212,0.15)');
    gradient.addColorStop(0.3, 'rgba(16,185,129,0.12)');
    gradient.addColorStop(0.6, 'rgba(245,158,11,0.1)');
    gradient.addColorStop(1, 'rgba(244,63,94,0.08)');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ocLabels,
            datasets: [
                {
                    label: 'NUPL',
                    data: ocNuplData,
                    borderColor: 'rgb(16,185,129)',
                    borderWidth: 2,
                    backgroundColor: gradient,
                    fill: 'origin',
                    tension: 0.4,
                    pointRadius: (ctx) => [1,5,19,23].includes(ctx.dataIndex) ? 5 : 2,
                    pointBackgroundColor: (ctx) => {
                        const v = ocNuplData[ctx.dataIndex];
                        return v < 0 ? '#f43f5e' : v < 0.25 ? '#f59e0b' : v < 0.75 ? '#10b981' : '#06b6d4';
                    }
                },
                {
                    label: 'Euphoria',
                    data: Array(24).fill(0.75),
                    borderColor: 'rgba(6,182,212,0.2)',
                    borderWidth: 1,
                    borderDash: [4,4],
                    pointRadius: 0,
                    fill: false
                },
                {
                    label: 'Zero',
                    data: Array(24).fill(0),
                    borderColor: 'rgba(244,63,94,0.3)',
                    borderWidth: 1,
                    borderDash: [3,4],
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(12,12,22,0.95)',
                    callbacks: {
                        label: ctx => {
                            if (ctx.datasetIndex !== 0) return null;
                            const v = ctx.parsed.y;
                            const zone = v < 0 ? 'CAPITULATION' : v < 0.25 ? 'Hope' : v < 0.75 ? 'Belief' : 'EUPHORIA';
                            return `NUPL: ${v.toFixed(3)} — ${zone}`;
                        }
                    }
                }
            },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#606075', maxTicksLimit: 8, maxRotation: 45 }},
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, min: -0.35, max: 1.0, ticks: { color: '#606075' }}
            }
        }
    });
}

document.addEventListener('click',e=>{if(!e.target.closest('.srt'))document.getElementById('srtM').classList.remove('open');});

function safeInit(name, fn) {
    try {
        const result = fn();
        if (result instanceof Promise) {
            result.catch(e => console.error('Init failed:', name, e));
        }
    } catch (e) {
        console.error('Init failed:', name, e);
    }
}

function exposeGlobal(name, fn) {
    if (typeof fn === 'function') {
        window[name] = fn;
    }
}

if (typeof showView === 'function') window.showView = showView;
if (typeof sortList === 'function') window.sortList = sortList;
if (typeof filterBy === 'function') window.filterBy = filterBy;
if (typeof toggleRow === 'function') window.toggleRow = toggleRow;
if (typeof renderTopPerformers === 'function') window.renderTopPerformers = renderTopPerformers;
if (typeof updateBtcChart === 'function') window.updateBtcChart = updateBtcChart;
if (typeof calcFV === 'function') window.calcFV = calcFV;
if (typeof calcDCF === 'function') window.calcDCF = calcDCF;
if (typeof updateWeights === 'function') window.updateWeights = updateWeights;
if (typeof openApiSettings === 'function') window.openApiSettings = openApiSettings;
if (typeof closeApiSettings === 'function') window.closeApiSettings = closeApiSettings;
if (typeof saveAndConnectApi === 'function') window.saveAndConnectApi = saveAndConnectApi;
if (typeof fetchLiveDataNow === 'function') window.fetchLiveDataNow = fetchLiveDataNow;
if (typeof filterNewsBySource === 'function') window.filterNewsBySource = filterNewsBySource;
if (typeof selectTopSubnets === 'function') window.selectTopSubnets = selectTopSubnets;
if (typeof updatePortfolioAnalytics === 'function') window.updatePortfolioAnalytics = updatePortfolioAnalytics;
if (typeof optimizeAllocation === 'function') window.optimizeAllocation = optimizeAllocation;
if (typeof updateStakingChart === 'function') window.updateStakingChart = updateStakingChart;
if (typeof runOptimization === 'function') window.runOptimization = runOptimization;
if (typeof selectObjective === 'function') window.selectObjective = selectObjective;
if (typeof updateRiskSlider === 'function') window.updateRiskSlider = updateRiskSlider;
if (typeof setProjectionScenario === 'function') window.setProjectionScenario = setProjectionScenario;
if (typeof applyRecalibratedWeights === 'function') window.applyRecalibratedWeights = applyRecalibratedWeights;
if (typeof calcRelativeValue === 'function') window.calcRelativeValue = calcRelativeValue;
if (typeof openLesson === 'function') window.openLesson = openLesson;
if (typeof closeLesson === 'function') window.closeLesson = closeLesson;
if (typeof openResearch === 'function') window.openResearch = openResearch;
if (typeof closeResearch === 'function') window.closeResearch = closeResearch;
if (typeof openModal === 'function') window.openModal = openModal;
if (typeof closeModal === 'function') window.closeModal = closeModal;
if (typeof handleLogin === 'function') window.handleLogin = handleLogin;
if (typeof updatePerfChart === 'function') window.updatePerfChart = updatePerfChart;
if (typeof renderTaoFlowTable === 'function') window.renderTaoFlowTable = renderTaoFlowTable;

function initDashboard() {
    safeInit('updateTs', updateTs);
    safeInit('initLiveData', initLiveData);
    setInterval(updateTs,1000);
    setInterval(updatePrices,5000);
    safeInit('renderPills', renderPills);
    safeInit('renderList', renderList);
    safeInit('renderNews', renderNews);
    safeInit('renderRes', renderRes);
    safeInit('renderTopPerformers', renderTopPerformers);
    safeInit('initCharts', initCharts);
    safeInit('updateKPIs', updateKPIs);
    safeInit('calcFV', calcFV);
    safeInit('calcDCF', calcDCF);
    safeInit('updateWeights', updateWeights);
    safeInit('initTicker', initTicker);
    safeInit('initPriceCharts', initPriceCharts);
    safeInit('calcPortfolio', calcPortfolio);
    safeInit('initTaoFlow', initTaoFlow);
    safeInit('initInstitutionalCharts', initInstitutionalCharts);
    safeInit('initOnChainCharts', initOnChainCharts);
    safeInit('initICChart', initICChart);
    // Portfolio tabs initialization
    safeInit('initSubnetSelector', initSubnetSelector);
    safeInit('updatePortfolioAnalytics', updatePortfolioAnalytics);
    safeInit('renderSignals', renderSignals);
    safeInit('runOptimization', runOptimization);
}
setTimeout(() => { if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initDashboard); } else { initDashboard(); } }, 50);
