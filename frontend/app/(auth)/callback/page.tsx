'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [_loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Handle Firebase redirect callback
    const handleCallback = async () => {
      try {
        // This would be handled by Firebase SDK in a real implementation
        // For now, just redirect to dashboard after a delay
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setLoading(false);
      }
    };

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <div className="space-y-4 rounded-lg bg-red-50 p-6">
        <h2 className="font-semibold text-red-900">Authentication Error</h2>
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-center">
      <div className="flex justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
      </div>
      <p className="text-gray-600">Authenticating...</p>
    </div>
  );
}
