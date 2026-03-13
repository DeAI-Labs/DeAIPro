'use client';

import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PriceChartProps {
  data: Array<{ timestamp: string; price: number }>;
  title?: string;
}

export function PriceChart({ data, title = 'TAO Price (USD)' }: PriceChartProps) {
  const chartData = {
    labels: data.map((d) => new Date(d.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: title,
        data: data.map((d) => d.price),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#2563eb',
        pointBorderColor: '#fff',
      },
    ],
  };

  return (
    <div className="relative h-80 w-full">
      <Line
        data={chartData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: {
                color: '#d1d5db',
              },
            },
          },
          scales: {
            y: {
              ticks: {
                color: '#9ca3af',
              },
              grid: {
                color: '#374151',
              },
            },
            x: {
              ticks: {
                color: '#9ca3af',
              },
              grid: {
                color: '#374151',
              },
            },
          },
        }}
      />
    </div>
  );
}

interface SubnetMetricsProps {
  subnets: Array<{ name: string; market_cap_millions: number }>;
  title?: string;
}

export function SubnetMetricsChart({
  subnets,
}: SubnetMetricsProps) {
  const chartData = {
    labels: subnets.map((s) => s.name),
    datasets: [
      {
        label: 'Market Cap (M)',
        data: subnets.map((s) => s.market_cap_millions),
        backgroundColor: [
          '#3b82f6',
          '#10b981',
          '#f59e0b',
          '#ef4444',
          '#8b5cf6',
        ],
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  return (
    <div className="relative h-80 w-full">
      <Bar
        data={chartData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: {
                color: '#d1d5db',
              },
            },
          },
          scales: {
            y: {
              ticks: {
                color: '#9ca3af',
              },
              grid: {
                color: '#374151',
              },
            },
            x: {
              ticks: {
                color: '#9ca3af',
              },
              grid: {
                color: '#374151',
              },
            },
          },
        }}
      />
    </div>
  );
}

interface CategoryDistributionProps {
  categories: Array<{ name: string; count: number }>;
  title?: string;
}

export function CategoryDistributionChart({
  categories,
}: CategoryDistributionProps) {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const chartData = {
    labels: categories.map((c) => c.name),
    datasets: [
      {
        data: categories.map((c) => c.count),
        backgroundColor: colors.slice(0, categories.length),
        borderColor: '#0f172a',
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="relative h-80 w-full">
      <Doughnut
        data={chartData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: '#d1d5db',
                padding: 16,
              },
            },
          },
        }}
      />
    </div>
  );
}
