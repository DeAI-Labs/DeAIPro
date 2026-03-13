'use client';

import { motion } from 'framer-motion';
import { Header, Sidebar, Footer, Container } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { PriceChart, SubnetMetricsChart, CategoryDistributionChart } from '@/components/features/Charts';
import { useStats, useSubnets } from '@/lib/hooks';

export default function AnalyticsPage() {
  return (
    <>
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 lg:ml-0">
          <Container className="py-8 space-y-8">
            <AnalyticsContent />
          </Container>
          <Footer />
        </main>
      </div>
    </>
  );
}

function AnalyticsContent() {
  const { data: stats } = useStats();
  const { data: subnets } = useSubnets({ limit: 20 });

  // Prepare price chart data with mock variations
  const priceData = [
    { timestamp: '00:00', price: stats?.data?.tao_price || 0 },
    { timestamp: '04:00', price: (stats?.data?.tao_price || 0) * 0.98 },
    { timestamp: '08:00', price: (stats?.data?.tao_price || 0) * 1.02 },
    { timestamp: '12:00', price: (stats?.data?.tao_price || 0) * 0.99 },
    { timestamp: '16:00', price: (stats?.data?.tao_price || 0) * 1.01 },
    { timestamp: '20:00', price: stats?.data?.tao_price || 0 },
  ];

  // Prepare subnet metrics for top 5
  const topSubnets = (subnets?.data || [])
    .slice(0, 5)
    .map((s) => ({
      name: s.name,
      market_cap_millions: s.market_cap_millions || 0,
    }));

  // Count subnets by category
  const categoryCounts = new Map<string, number>();
  (subnets?.data || []).forEach((s) => {
    const count = categoryCounts.get(s.category) || 0;
    categoryCounts.set(s.category, count + 1);
  });

  const categories = Array.from(categoryCounts, ([name, count]) => ({
    name,
    count,
  }));

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.section variants={itemVariants}>
        <h1 className="text-4xl font-bold text-white mb-2">Analytics</h1>
        <p className="text-gray-400">Track market trends and subnet performance</p>
      </motion.section>

      {/* Price Chart */}
      <motion.section variants={itemVariants}>
        <Card header={<h2 className="text-xl font-semibold text-white">Price History (24H)</h2>}>
          <div className="p-6">
            {priceData.length > 0 ? (
              <PriceChart data={priceData} />
            ) : (
              <div className="text-gray-400 text-center py-8">No price data available</div>
            )}
          </div>
        </Card>
      </motion.section>

      {/* Subnet Metrics Grid */}
      <motion.div
        className="grid gap-6 md:grid-cols-2"
        variants={itemVariants}
      >
        {/* Market Cap Chart */}
        <Card header={<h2 className="text-xl font-semibold text-white">Top Subnets by Market Cap</h2>}>
          <div className="p-6">
            {topSubnets.length > 0 ? (
              <SubnetMetricsChart subnets={topSubnets} />
            ) : (
              <div className="text-gray-400 text-center py-8">No subnet data available</div>
            )}
          </div>
        </Card>

        {/* Category Distribution */}
        <Card header={<h2 className="text-xl font-semibold text-white">Subnet Categories</h2>}>
          <div className="p-6">
            {categories.length > 0 ? (
              <CategoryDistributionChart categories={categories} />
            ) : (
              <div className="text-gray-400 text-center py-8">No category data available</div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Statistics Grid */}
      <motion.section variants={itemVariants}>
        <Card header={<h2 className="text-xl font-semibold text-white">Summary Statistics</h2>}>
          <div className="p-6 grid gap-4 md:grid-cols-3">
            <div className="bg-slate-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm font-medium">Total Subnets</p>
              <p className="text-2xl font-bold text-white mt-2">
                {stats?.data?.active_subnets || 0}
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm font-medium">Total Market Cap</p>
              <p className="text-2xl font-bold text-white mt-2">
                ${((stats?.data?.market_cap || 0) / 1e9).toFixed(2)}B
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <p className="text-gray-400 text-sm font-medium">24h Volume</p>
              <p className="text-2xl font-bold text-white mt-2">
                ${((stats?.data?.volume_24h || 0) / 1e6).toFixed(2)}M
              </p>
            </div>
          </div>
        </Card>
      </motion.section>
    </motion.div>
  );
}
