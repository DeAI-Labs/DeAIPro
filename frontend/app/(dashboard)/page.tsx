'use client';

import { Suspense } from 'react';
import { useStats, useSubnets } from '@/lib/hooks';
import { Container, Header, Sidebar, Footer } from '@/components/layout';
import { Card, StatsBox, Badge } from '@/components/ui';
import { Subnet } from '@/lib/types';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  return (
    <>
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 lg:ml-0">
          <Container className="py-8 space-y-8">
            <Suspense fallback={<DashboardLoadingState />}>
              <DashboardContent />
            </Suspense>
          </Container>
          <Footer />
        </main>
      </div>
    </>
  );
}

function DashboardContent() {
  const { data: stats } = useStats();
  const { data: subnets } = useSubnets({ limit: 10 });

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.section
        className="space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold text-white">DeAIPro Dashboard</h1>
        <p className="text-lg text-gray-400">
          Real-time analytics and intelligence for the Bittensor ecosystem
        </p>
      </motion.section>

      {/* Stats Grid */}
      <motion.section
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <StatsBox
          label="TAO Price"
          value={stats?.data?.tao_price ? `$${stats.data.tao_price.toFixed(2)}` : '--'}
          change={0}
          changeType="neutral"
        />
        <StatsBox
          label="Market Cap"
          value={stats?.data?.market_cap ? `$${(stats.data.market_cap / 1e9).toFixed(2)}B` : '--'}
          change={0}
          changeType="neutral"
        />
        <StatsBox
          label="Active Subnets"
          value={stats?.data?.active_subnets ?? '--'}
          change={0}
          changeType="neutral"
        />
        <StatsBox
          label="24h Volume"
          value={stats?.data?.volume_24h ? `$${(stats.data.volume_24h / 1e6).toFixed(2)}M` : '--'}
          change={0}
          changeType="neutral"
        />
      </motion.section>

      {/* Subnets Overview */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <Card header={<h2 className="text-2xl font-bold text-white">Top Subnets</h2>}>
          {subnets?.data && subnets.data.length > 0 ? (
            <div className="space-y-4">
              {subnets.data.map((subnet: Subnet) => (
                <div
                  key={subnet.id}
                  className="flex items-center justify-between p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <div className="space-y-1">
                    <h3 className="font-semibold text-white">{subnet.name}</h3>
                    <div className="flex gap-2">
                      <Badge variant="info" size="sm">
                        ID: {subnet.id}
                      </Badge>
                      <Badge variant="success" size="sm">
                        {subnet.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-lg font-bold text-white">
                      ${subnet.market_cap_millions.toFixed(1)}M
                    </p>
                    <p className="text-sm text-green-400">{subnet.apy.toFixed(1)}% APY</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-400">No subnets available</div>
          )}
        </Card>
      </motion.section>
    </div>
  );
}

function DashboardLoadingState() {
  return (
    <div className="space-y-8">
      <div className="h-12 bg-slate-800 rounded-lg animate-pulse" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-slate-800 rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="h-64 bg-slate-800 rounded-lg animate-pulse" />
    </div>
  );
}
