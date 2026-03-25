'use client';

import React, { type ReactNode } from 'react';
import Link from 'next/link';

/* ── Container ────────────────────────────────────────────────────── */

export function Container({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}

/* ── Header ───────────────────────────────────────────────────────── */

export function Header() {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'rgba(9,12,18,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 24px',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #5b5ef4 0%, #22d3ee 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
            color: '#fff',
          }}
        >
          τ
        </span>
        <span style={{ color: '#dce8f0', fontSize: 16, fontWeight: 600 }}>
          DeAI <span style={{ fontWeight: 400, color: '#5b5ef4' }}>Nexus</span>
        </span>
      </Link>

      <nav style={{ display: 'flex', gap: 24 }}>
        <Link href="/" style={{ color: '#8a9bb0', fontSize: 14, textDecoration: 'none' }}>Home</Link>
        <Link href="/dashboard" style={{ color: '#8a9bb0', fontSize: 14, textDecoration: 'none' }}>Dashboard</Link>
        <Link href="/analytics" style={{ color: '#8a9bb0', fontSize: 14, textDecoration: 'none' }}>Analytics</Link>
      </nav>
    </header>
  );
}

/* ── Sidebar ──────────────────────────────────────────────────────── */

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/analytics', label: 'Analytics' },
];

export function Sidebar() {
  return (
    <aside
      className="hidden lg:block"
      style={{
        position: 'fixed',
        top: 56,
        left: 0,
        bottom: 0,
        width: 240,
        background: '#090c12',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        padding: '20px 12px',
      }}
    >
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'block',
              padding: '10px 14px',
              borderRadius: 8,
              fontSize: 14,
              color: '#8a9bb0',
              textDecoration: 'none',
              transition: 'background 0.15s',
            }}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

/* ── Footer ───────────────────────────────────────────────────────── */

export function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '24px 32px',
        fontSize: 12,
        color: '#4a5f75',
        textAlign: 'center',
      }}
    >
      © {new Date().getFullYear()} DeAI Strategies Corp. All Rights Reserved.
    </footer>
  );
}
