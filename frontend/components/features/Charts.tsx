'use client';

import React from 'react';

/* ── PriceChart ───────────────────────────────────────────────────── */

interface PricePoint {
  timestamp: string;
  price: number;
}

export function PriceChart({ data }: { data: PricePoint[] }) {
  if (!data.length) return null;

  const max = Math.max(...data.map((d) => d.price));
  const min = Math.min(...data.map((d) => d.price));
  const range = max - min || 1;
  const w = 600;
  const h = 200;
  const pad = 30;

  const points = data
    .map((d, i) => {
      const x = pad + (i / (data.length - 1)) * (w - 2 * pad);
      const y = h - pad - ((d.price - min) / range) * (h - 2 * pad);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto' }}>
        {/* gradient fill */}
        <defs>
          <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5b5ef4" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#5b5ef4" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={`${pad},${h - pad} ${points} ${w - pad},${h - pad}`}
          fill="url(#priceFill)"
        />
        <polyline points={points} fill="none" stroke="#5b5ef4" strokeWidth="2" />
        {/* x-axis labels */}
        {data.map((d, i) => {
          const x = pad + (i / (data.length - 1)) * (w - 2 * pad);
          return (
            <text key={i} x={x} y={h - 6} textAnchor="middle" fill="#6b7280" fontSize="10">
              {d.timestamp}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

/* ── SubnetMetricsChart ───────────────────────────────────────────── */

interface SubnetMetric {
  name: string;
  market_cap_millions: number;
}

export function SubnetMetricsChart({ subnets }: { subnets: SubnetMetric[] }) {
  if (!subnets.length) return null;

  const max = Math.max(...subnets.map((s) => s.market_cap_millions)) || 1;
  const colors = ['#5b5ef4', '#22d3ee', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {subnets.map((s, i) => (
        <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 100, fontSize: 13, color: '#d1d5db', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {s.name}
          </span>
          <div style={{ flex: 1, background: '#1e293b', borderRadius: 4, height: 22, overflow: 'hidden' }}>
            <div
              style={{
                width: `${(s.market_cap_millions / max) * 100}%`,
                height: '100%',
                background: colors[i % colors.length],
                borderRadius: 4,
                transition: 'width 0.6s ease',
              }}
            />
          </div>
          <span style={{ width: 60, fontSize: 12, color: '#9ca3af', textAlign: 'right' }}>
            ${s.market_cap_millions.toFixed(1)}M
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── CategoryDistributionChart ───────────────────────────────────── */

interface CategoryData {
  name: string;
  count: number;
}

export function CategoryDistributionChart({ categories }: { categories: CategoryData[] }) {
  if (!categories.length) return null;

  const total = categories.reduce((sum, c) => sum + c.count, 0) || 1;
  const colors = ['#5b5ef4', '#22d3ee', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* bar */}
      <div style={{ display: 'flex', height: 28, borderRadius: 6, overflow: 'hidden' }}>
        {categories.map((c, i) => (
          <div
            key={c.name}
            style={{
              width: `${(c.count / total) * 100}%`,
              background: colors[i % colors.length],
              minWidth: 4,
            }}
            title={`${c.name}: ${c.count}`}
          />
        ))}
      </div>
      {/* legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px' }}>
        {categories.map((c, i) => (
          <span key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#9ca3af' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: colors[i % colors.length] }} />
            {c.name} ({c.count})
          </span>
        ))}
      </div>
    </div>
  );
}
