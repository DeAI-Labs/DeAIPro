'use client';

import type { ReactNode } from 'react';
import React from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error) => ReactNode;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  { hasError: boolean; error: Error | null }
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback?.(this.state.error!) || (
          <div className="flex min-h-screen items-center justify-center bg-slate-900">
            <div className="space-y-4 rounded-lg bg-slate-800 border border-red-600 p-6 shadow-lg max-w-md w-full mx-4">
              <h2 className="text-xl font-bold text-red-400">Something went wrong</h2>
              <p className="text-sm text-gray-300">{this.state.error?.message || 'An unexpected error occurred'}</p>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
