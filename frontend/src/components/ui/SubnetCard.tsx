import React from "react";
import { Subnet } from "../../types";
import { Card, Badge } from "./Button";
import {
  formatCurrency,
  formatPercentage,
  getCategoryIcon,
  getCategoryColor,
  getTrendIndicator,
  getScoreColor,
  formatCompactNumber,
} from "../../utils/formatters";

interface SubnetCardProps {
  subnet: Subnet;
  onClick?: () => void;
  isSelected?: boolean;
}

export const SubnetCard: React.FC<SubnetCardProps> = ({
  subnet,
  onClick,
  isSelected = false,
}) => {
  const trend = getTrendIndicator(subnet.trend);

  return (
    <Card
      onClick={onClick}
      hover
      className={`
        overflow-hidden transition-all
        ${isSelected ? "ring-2 ring-blue-500" : ""}
      `}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getCategoryIcon(subnet.cat)}</span>
            <div>
              <h3 className="font-bold text-lg">{subnet.n}</h3>
              <p className="text-xs text-gray-500">{`Subnet #${subnet.id}`}</p>
            </div>
          </div>
          <Badge
            variant={subnet.trend === "up" ? "success" : subnet.trend === "down" ? "danger" : "warning"}
            size="sm"
          >
            {trend.icon} {subnet.trend}
          </Badge>
        </div>

        {/* Category Badge */}
        <div className="mb-3">
          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getCategoryColor(subnet.cat)}`}>
            {subnet.cat}
          </span>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-xs text-gray-600 mb-1">Market Cap</p>
            <p className="font-bold text-sm">{formatCurrency(subnet.mc * 1_000_000)}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-xs text-gray-600 mb-1">Score</p>
            <div className={`inline-block px-2 py-1 rounded text-sm font-bold ${getScoreColor(subnet.score)}`}>
              {subnet.score}
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-xs text-gray-600 mb-1">Daily TAO</p>
            <p className="font-bold text-sm">{formatCompactNumber(subnet.dailyTao)}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-xs text-gray-600 mb-1">Uptime</p>
            <p className="font-bold text-sm">{subnet.uptime}%</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex justify-between text-xs text-gray-600 border-t pt-2">
          <div>Validators: {subnet.validators}</div>
          <div>Miners: {subnet.miners}</div>
        </div>
      </div>
    </Card>
  );
};

interface StatCardProps {
  icon?: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  trendLabel?: string;
  color?: "blue" | "green" | "orange" | "red" | "purple";
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  title,
  value,
  subtitle,
  trend,
  trendLabel = "vs last update",
  color = "blue",
  onClick,
}) => {
  const colorStyles = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    orange: "bg-orange-50 text-orange-600 border-orange-200",
    red: "bg-red-50 text-red-600 border-red-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
  };

  return (
    <Card
      onClick={onClick}
      hover
      className={`p-6 border-l-4 ${colorStyles[color]}`}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        {icon && <div className="text-xl">{icon}</div>}
      </div>

      <div className="mb-3">
        <p className="text-2xl font-bold">{value}</p>
        {subtitle && <p className="text-xs text-gray-600">{subtitle}</p>}
      </div>

      {trend !== undefined && (
        <div
          className={`
            inline-block text-xs font-semibold px-2 py-1 rounded
            ${
              trend > 0
                ? "bg-green-100 text-green-800"
                : trend < 0
                ? "bg-red-100 text-red-800"
                : "bg-gray-100 text-gray-800"
            }
          `}
        >
          {trend > 0 ? "+" : ""}
          {trend}% {trendLabel}
        </div>
      )}
    </Card>
  );
};

interface SubnetTableProps {
  subnets: Subnet[];
  isLoading?: boolean;
  onSubnetClick?: (subnet: Subnet) => void;
  selectedSubnetId?: number;
  columns?: Array<
    | "rank"
    | "name"
    | "category"
    | "marketCap"
    | "score"
    | "dailyTao"
    | "uptime"
    | "trend"
  >;
}

export const SubnetTable: React.FC<SubnetTableProps> = ({
  subnets,
  isLoading = false,
  onSubnetClick,
  selectedSubnetId,
  columns = [
    "rank",
    "name",
    "category",
    "marketCap",
    "score",
    "dailyTao",
    "uptime",
  ],
}) => {
  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.includes("rank") && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">#</th>
              )}
              {columns.includes("name") && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Name</th>
              )}
              {columns.includes("category") && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Category</th>
              )}
              {columns.includes("marketCap") && (
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">
                  Market Cap
                </th>
              )}
              {columns.includes("score") && (
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">
                  Score
                </th>
              )}
              {columns.includes("dailyTao") && (
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">
                  Daily TAO
                </th>
              )}
              {columns.includes("uptime") && (
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">
                  Uptime
                </th>
              )}
              {columns.includes("trend") && (
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">
                  Trend
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {subnets.map((subnet, index) => {
              const trend = getTrendIndicator(subnet.trend);
              return (
                <tr
                  key={subnet.id}
                  onClick={() => onSubnetClick?.(subnet)}
                  className={`
                    hover:bg-gray-50 transition-colors cursor-pointer
                    ${selectedSubnetId === subnet.id ? "bg-blue-50" : ""}
                  `}
                >
                  {columns.includes("rank") && (
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {index + 1}
                    </td>
                  )}
                  {columns.includes("name") && (
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <span>{getCategoryIcon(subnet.cat)}</span>
                        {subnet.n}
                      </div>
                    </td>
                  )}
                  {columns.includes("category") && (
                    <td className="px-4 py-3 text-sm">
                      <Badge size="sm" className={getCategoryColor(subnet.cat)}>
                        {subnet.cat}
                      </Badge>
                    </td>
                  )}
                  {columns.includes("marketCap") && (
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {formatCurrency(subnet.mc * 1_000_000)}
                    </td>
                  )}
                  {columns.includes("score") && (
                    <td className="px-4 py-3 text-sm text-center">
                      <Badge size="sm" className={getScoreColor(subnet.score)}>
                        {subnet.score}
                      </Badge>
                    </td>
                  )}
                  {columns.includes("dailyTao") && (
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {formatCompactNumber(subnet.dailyTao)} TAO
                    </td>
                  )}
                  {columns.includes("uptime") && (
                    <td className="px-4 py-3 text-sm text-center">
                      {subnet.uptime}%
                    </td>
                  )}
                  {columns.includes("trend") && (
                    <td className="px-4 py-3 text-sm text-center">
                      <span className={trend.color}>{trend.icon}</span>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

interface CategoryDistributionProps {
  subnets: Subnet[];
}

export const CategoryDistribution: React.FC<CategoryDistributionProps> = ({
  subnets,
}) => {
  const categoryStats = subnets.reduce(
    (acc, subnet) => {
      if (!acc[subnet.cat]) {
        acc[subnet.cat] = { count: 0, totalMarketCap: 0 };
      }
      acc[subnet.cat].count += 1;
      acc[subnet.cat].totalMarketCap += subnet.mc;
      return acc;
    },
    {} as { [key: string]: { count: number; totalMarketCap: number } }
  );

  return (
    <Card className="p-6">
      <h3 className="font-bold text-lg mb-4">By Category</h3>
      <div className="space-y-3">
        {Object.entries(categoryStats)
          .sort((a, b) => b[1].count - a[1].count)
          .map(([category, stats]) => (
            <div key={category}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">
                  {getCategoryIcon(category)} {category}
                </span>
                <span className="text-xs text-gray-600">{stats.count} subnets</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${(stats.count / subnets.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
      </div>
    </Card>
  );
};
