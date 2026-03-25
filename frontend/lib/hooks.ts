'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchStats, fetchSubnets, fetchNews, fetchSentiment } from './api';

/* ── useStats ─────────────────────────────────────────────────────── */

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const stats = await fetchStats();
      return { data: stats };
    },
  });
}

/* ── useSubnets ───────────────────────────────────────────────────── */

interface UseSubnetsOptions {
  limit?: number;
}

export function useSubnets(opts?: UseSubnetsOptions) {
  return useQuery({
    queryKey: ['subnets', opts?.limit],
    queryFn: async () => {
      const all = await fetchSubnets();
      return {
        data: opts?.limit ? all.slice(0, opts.limit) : all,
      };
    },
  });
}

/* ── useNews ──────────────────────────────────────────────────────── */

export function useNews() {
  return useQuery({
    queryKey: ['news'],
    queryFn: fetchNews,
  });
}

/* ── useSentiment ─────────────────────────────────────────────────── */

export function useSentiment() {
  return useQuery({
    queryKey: ['sentiment'],
    queryFn: fetchSentiment,
  });
}
