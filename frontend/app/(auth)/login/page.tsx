'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  auth,
  googleProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from '@/lib/firebase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const signInWithEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to sign in with email. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithPopup(auth, googleProvider);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to sign in with Google. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">DeAIPro</h1>
        <p className="mt-2 text-gray-400">Bittensor Intelligence Analytics</p>
      </div>

      <div className="space-y-6 rounded-xl bg-white p-8 shadow-lg">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
          <p className="mt-2 text-sm text-gray-500">
            Use your email and password or continue with Google.
          </p>
        </div>

        {error ? (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : null}

        <form className="space-y-4" onSubmit={signInWithEmail}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in with email'}
          </button>
        </form>

        <div className="flex items-center gap-3 pt-4 text-sm text-gray-400">
          <span className="h-px flex-1 bg-gray-200"></span>
          <span>or continue with</span>
          <span className="h-px flex-1 bg-gray-200"></span>
        </div>

        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={loading}
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Please wait…' : 'Sign in with Google'}
        </button>

        <div className="border-t border-gray-200 pt-4 text-sm text-gray-600">
          Don&apos;t have access yet?{' '}
          <Link href="/access-request" className="font-semibold text-blue-600 hover:underline">
            Request Access
          </Link>
        </div>
      </div>

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
