'use client';

import { useUIStore } from '@/lib/store';
import { PriceTicker } from '@/components/ui/PriceTicker';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function Container({ children, className = '' }: ContainerProps) {
  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}

export function Header() {
  const { toggleSidebar } = useUIStore();

  return (
    <header className="bg-slate-900 border-b border-slate-700 sticky top-0 z-40">
      <Container className="flex items-center justify-between h-16">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-slate-800 text-gray-300 hover:text-white transition-colors"
            aria-label="Toggle sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-white">DeAIPro</h1>
        </div>
        <div className="flex items-center gap-4">
          <PriceTicker />
          <span className="text-sm text-gray-400 hidden sm:inline">Bittensor Analytics</span>
        </div>
      </Container>
    </header>
  );
}

export function Sidebar() {
  const { sidebarOpen } = useUIStore();

  if (!sidebarOpen) return null;

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-slate-900 border-r border-slate-700 overflow-y-auto z-30">
      <nav className="px-4 py-6 space-y-2">
        <SidebarLink href="/dashboard" label="Dashboard" />
        <SidebarLink href="/analytics" label="Analytics" />
        <SidebarLink href="/subnets" label="Subnets" />
        <SidebarLink href="/news" label="News" />
        <SidebarLink href="/research" label="Research" />
        <SidebarLink href="/lessons" label="Education" />
      </nav>
    </aside>
  );
}

interface SidebarLinkProps {
  href: string;
  label: string;
}

function SidebarLink({ href, label }: SidebarLinkProps) {
  return (
    <a
      href={href}
      className="block px-4 py-2 rounded-lg text-gray-300 hover:bg-slate-800 hover:text-white transition-colors"
    >
      {label}
    </a>
  );
}

export function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-700 py-8 mt-12">
      <Container className="flex items-center justify-between">
        <p className="text-gray-400 text-sm">
          © 2026 DeAIPro. Real-time Bittensor Analytics Platform.
        </p>
        <div className="flex gap-6">
          <a href="/docs" className="text-gray-400 hover:text-white text-sm transition-colors">
            Docs
          </a>
          <a href="/api" className="text-gray-400 hover:text-white text-sm transition-colors">
            API
          </a>
        </div>
      </Container>
    </footer>
  );
}
