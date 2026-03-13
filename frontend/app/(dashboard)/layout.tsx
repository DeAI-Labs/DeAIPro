import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Dashboard - DeAIPro',
  description: 'Main dashboard with live Bittensor subnet analytics',
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {children}
    </div>
  );
}
