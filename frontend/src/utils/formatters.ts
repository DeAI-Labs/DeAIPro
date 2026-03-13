import { Subnet } from "../types";

/**
 * Format currency value
 */
export const formatCurrency = (value: number | undefined): string => {
  if (value === undefined || value === null) return "-";

  if (Math.abs(value) >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
};

/**
 * Format percentage
 */
export const formatPercentage = (
  value: number | undefined,
  decimals = 2,
  includeSign = true
): string => {
  if (value === undefined || value === null) return "-";

  const percent = (value * 100).toFixed(decimals);
  const prefix = includeSign && value > 0 ? "+" : "";

  return `${prefix}${percent}%`;
};

/**
 * Format number with commas
 */
export const formatNumber = (value: number | undefined, decimals = 2): string => {
  if (value === undefined || value === null) return "-";

  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Format large numbers with abbreviations (K, M, B, T)
 */
export const formatCompactNumber = (value: number | undefined): string => {
  if (value === undefined || value === null) return "-";

  if (Math.abs(value) >= 1_000_000_000_000) {
    return (value / 1_000_000_000_000).toFixed(2) + "T";
  }
  if (Math.abs(value) >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(2) + "B";
  }
  if (Math.abs(value) >= 1_000_000) {
    return (value / 1_000_000).toFixed(2) + "M";
  }
  if (Math.abs(value) >= 1_000) {
    return (value / 1_000).toFixed(2) + "K";
  }

  return value.toFixed(2);
};

/**
 * Get trend indicator text and color
 */
export const getTrendIndicator = (
  trend: "up" | "down" | "stable" | string
): { icon: string; color: string; label: string } => {
  switch (trend) {
    case "up":
      return { icon: "↑", color: "text-green-500", label: "Uptrend" };
    case "down":
      return { icon: "↓", color: "text-red-500", label: "Downtrend" };
    case "stable":
      return { icon: "→", color: "text-yellow-500", label: "Stable" };
    default:
      return { icon: "-", color: "text-gray-500", label: "Unknown" };
  }
};

/**
 * Get color based on score
 */
export const getScoreColor = (score: number): string => {
  if (score >= 80) return "bg-green-100 text-green-800";
  if (score >= 60) return "bg-blue-100 text-blue-800";
  if (score >= 40) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
};

/**
 * Get category icon
 */
export const getCategoryIcon = (category: string): string => {
  const icons: { [key: string]: string } = {
    Inference: "🧠",
    Compute: "⚙️",
    Storage: "💾",
    Vision: "👁️",
    Audio: "🎵",
    Data: "📊",
    Finance: "💰",
    Training: "🎓",
    Infrastructure: "🏗️",
    Research: "🔬",
    Social: "👥",
    Code: "💻",
    Reasoning: "🤔",
    "Post-Training": "🎯",
    Other: "📦",
  };

  return icons[category] || "📦";
};

/**
 * Get category color
 */
export const getCategoryColor = (category: string): string => {
  const colors: { [key: string]: string } = {
    Inference: "bg-purple-100 text-purple-800",
    Compute: "bg-blue-100 text-blue-800",
    Storage: "bg-orange-100 text-orange-800",
    Vision: "bg-pink-100 text-pink-800",
    Audio: "bg-indigo-100 text-indigo-800",
    Data: "bg-cyan-100 text-cyan-800",
    Finance: "bg-green-100 text-green-800",
    Training: "bg-yellow-100 text-yellow-800",
    Infrastructure: "bg-gray-100 text-gray-800",
    Research: "bg-red-100 text-red-800",
    Social: "bg-teal-100 text-teal-800",
    Code: "bg-lime-100 text-lime-800",
    Reasoning: "bg-rose-100 text-rose-800",
    "Post-Training": "bg-amber-100 text-amber-800",
  };

  return colors[category] || "bg-gray-100 text-gray-800";
};

/**
 * Compare subnet performance
 */
export const compareSubnets = (
  subnet1: Subnet,
  subnet2: Subnet
): { winner: string; differences: { [key: string]: number | string } } => {
  const differences: { [key: string]: number | string } = {};

  const metrics: (keyof Subnet)[] = [
    "mc",
    "score",
    "em",
    "val",
    "uptime",
    "github",
  ];

  metrics.forEach((metric) => {
    const val1 = subnet1[metric];
    const val2 = subnet2[metric];

    if (typeof val1 === "number" && typeof val2 === "number") {
      differences[String(metric)] = ((val1 - val2) / val2) * 100;
    }
  });

  // Determine winner based on market cap
  const winner = subnet1.mc > subnet2.mc ? subnet1.n : subnet2.n;

  return { winner, differences };
};

/**
 * Calculate ROI
 */
export const calculateROI = (
  entryPrice: number,
  currentPrice: number,
  quantity: number = 1
): { absolute: number; percentage: number } => {
  const invested = entryPrice * quantity;
  const current = currentPrice * quantity;
  const absolute = current - invested;
  const percentage = (absolute / invested) * 100;

  return { absolute, percentage };
};

/**
 * Validate email
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Format time ago
 */
export const formatTimeAgo = (date: Date | string | number): string => {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
};

/**
 * Parse time string to date
 */
export const parseTimeString = (timeStr: string): Date => {
  const now = new Date();

  if (timeStr.includes("hour")) {
    const hours = parseInt(timeStr);
    now.setHours(now.getHours() - hours);
    return now;
  }

  if (timeStr.includes("day")) {
    const days = parseInt(timeStr);
    now.setDate(now.getDate() - days);
    return now;
  }

  if (timeStr.includes("minute")) {
    const minutes = parseInt(timeStr);
    now.setMinutes(now.getMinutes() - minutes);
    return now;
  }

  return now;
};

/**
 * Shuffle array
 */
export const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Generate color from string (for avatars, etc)
 */
export const generateColorFromString = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-green-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-purple-500",
    "bg-pink-500",
  ];

  return colors[Math.abs(hash) % colors.length];
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Get initials from name
 */
export const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};
