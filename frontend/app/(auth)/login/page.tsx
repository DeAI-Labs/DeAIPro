'use client';

import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">DeAIPro</h1>
        <p className="mt-2 text-gray-400">Bittensor Intelligence Analytics</p>
      </div>

      {/* Card */}
      <div className="space-y-4 rounded-xl bg-white p-8 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>

        {/* Google Login Button - Placeholder */}
        <button
          className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 font-medium text-gray-900 transition hover:bg-gray-50 active:bg-gray-100"
          disabled
        >
          Sign in with Google (Coming Soon)
        </button>

        {/* Temporary Access */}
        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-600">
            Don&apos;t have access yet?{' '}
            <Link href="/access-request" className="font-semibold text-blue-600 hover:underline">
              Request Access
            </Link>
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="space-y-3 text-center">
        <h3 className="font-semibold text-white">Why DeAIPro?</h3>
        <ul className="space-y-2 text-sm text-gray-400">
          <li>✓ Real-time subnet analytics</li>
          <li>✓ Live market data & insights</li>
          <li>✓ Comprehensive research</li>
        </ul>
      </div>
    </div>
  );
}
