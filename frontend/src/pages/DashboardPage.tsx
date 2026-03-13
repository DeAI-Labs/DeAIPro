import React, { useState } from "react";
import { useData } from "../contexts/DataContext";
import {
  Header,
  Container,
  Grid,
  EmptyState,
} from "../components/layout/Layout";
import {
  StatCard,
  SubnetCard,
  CategoryDistribution,
} from "../components/ui/SubnetCard";
import { LoadingSpinner, Alert } from "../components/ui/Button";
import { useFilteredAndSortedSubnets, usePaginatedItems, useSubnetStats } from "../utils/hooks";
import { formatCurrency, formatCompactNumber } from "../utils/formatters";
import { Input, Select } from "../components/ui/Button";

export const DashboardPage: React.FC = () => {
  const { state } = useData();
  const [selectedSubnet, setSelectedSubnet] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  // Get filtered and sorted subnets
  const filteredSubnets = useFilteredAndSortedSubnets(
    state.subnets,
    {
      searchTerm,
      category: categoryFilter || undefined,
    },
    "mc",
    "desc"
  );

  // Paginate
  const { items: paginatedSubnets } = usePaginatedItems(
    filteredSubnets,
    page,
    12
  );

  // Calculate stats
  const stats = useSubnetStats(state.subnets);

  // Get unique categories for filter
  const categories = Array.from(
    new Set(state.subnets.map((s) => s.cat))
  ).sort();

  // Handle loading state
  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Loading DeAIPro Dashboard..." />
      </div>
    );
  }

  return (
    <>
      <Header
        title="DeAIPro Dashboard"
        subtitle="Real-time Bittensor Ecosystem Intelligence"
      />

      <div className="relative h-full w-full">
        <Container>
        {/* Alert Messages */}
        {state.error && (
          <Alert
            type="error"
            title="Error loading data"
            message={state.error}
            className="mb-6"
          />
        )}

        {state.isSyncingData && (
          <Alert
            type="info"
            title="Syncing"
            message="Data synchronization in progress..."
            className="mb-6"
          />
        )}

        {/* Key Statistics */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Key Metrics</h2>
          <Grid columns={4} gap="md">
            <StatCard
              icon="💰"
              title="Total Market Cap"
              value={formatCurrency(state.stats?.market_cap || 0)}
              subtitle="Entire ecosystem"
              color="blue"
            />

            <StatCard
              icon="🪙"
              title="TAO Price"
              value={formatCurrency(state.stats?.tao_price || 0)}
              trend={state.stats?.tao_price_change_24h}
              trendLabel="24h change"
              color="green"
            />

            <StatCard
              icon="📊"
              title="Active Subnets"
              value={state.stats?.active_subnets || 0}
              color="orange"
            />

            <StatCard
              icon="💵"
              title="Trading Volume"
              value={formatCurrency(state.stats?.volume_24h || 0)}
              subtitle="24h volume"
              color="purple"
            />
          </Grid>
        </div>

        {/* Ecosystem Overview */}
        <div className="mb-8">
          <Grid columns={2} gap="lg">
            <div>
              <h2 className="text-xl font-bold mb-4">Subnet Performance Overview</h2>
              <Grid columns={2} gap="md">
                <StatCard
                  title="Avg Score"
                  value={stats.averageScore.toFixed(1)}
                  color="blue"
                />
                <StatCard
                  title="Median Market Cap"
                  value={formatCurrency(stats.medianMarketCap * 1_000_000)}
                  color="green"
                />
                <StatCard
                  title="Total Emissions"
                  value={formatCompactNumber(stats.totalEmissions)}
                  color="orange"
                />
                <StatCard
                  title="Total Market Cap"
                  value={formatCurrency(stats.totalMarketCap * 1_000_000)}
                  color="purple"
                />
              </Grid>
            </div>

            <CategoryDistribution subnets={state.subnets} />
          </Grid>
        </div>

        {/* Subnets List */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Top Subnets</h2>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Input
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              icon="🔍"
            />

            <Select
              options={[
                { value: "", label: "All Categories" },
                ...categories.map((cat) => ({ value: cat, label: cat })),
              ]}
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              label="Filter by Category"
            />
          </div>

          {/* Subnets Grid */}
          {paginatedSubnets.length > 0 ? (
            <>
              <Grid columns={3} gap="md">
                {paginatedSubnets.map((subnet) => (
                  <SubnetCard
                    key={subnet.id}
                    subnet={subnet}
                    onClick={() => setSelectedSubnet(subnet.id)}
                    isSelected={selectedSubnet === subnet.id}
                  />
                ))}
              </Grid>

              {/* Pagination */}
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                >
                  ← Previous
                </button>

                <div className="text-sm text-gray-600">
                  Page {page} of{" "}
                  {Math.ceil(filteredSubnets.length / 12)}
                </div>

                <button
                  onClick={() =>
                    setPage((p) => {
                      const maxPage = Math.ceil(filteredSubnets.length / 12);
                      return Math.min(maxPage, p + 1);
                    })
                  }
                  disabled={page >= Math.ceil(filteredSubnets.length / 12)}
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                >
                  Next →
                </button>
              </div>
            </>
          ) : (
            <EmptyState
              icon="🔍"
              title="No subnets found"
              message={
                searchTerm || categoryFilter
                  ? "Try adjusting your search filters"
                  : "No subnets available"
              }
            />
          )}
        </div>

        {/* Related News Snippet */}
        {state.news.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Latest News</h2>
            <div className="space-y-2">
              {state.news.slice(0, 5).map((news, i) => (
                <div
                  key={i}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg">📰</span>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{news.t}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-600">{news.s}</span>
                        <span className="text-xs text-gray-400">{news.tm}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </Container>
      </div>
    </>
  );
};
