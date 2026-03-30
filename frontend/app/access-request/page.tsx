'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function AccessRequestPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/request-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || data?.message || 'Request failed.');
      }

      setMessage(data.message || `Access request submitted for ${email}.`);
      setEmail('');
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to submit access request. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">Request Access</h1>
        <p className="mt-2 text-gray-400">Submit your email and we will review your request.</p>
      </div>

      <div className="space-y-4 rounded-xl bg-white p-8 shadow-lg">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Guest Access Request</h2>
          <p className="mt-2 text-sm text-gray-500">
            If you do not yet have credentials, enter your email and our team will follow up.
          </p>
        </div>

        {message ? (
          <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700">{message}</div>
        ) : null}

        {error ? (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
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

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Submitting…' : 'Request Access'}
          </button>
        </form>

        <div className="border-t border-gray-200 pt-4 text-sm text-gray-600">
          Already have access?{' '}
          <Link href="/login" className="font-semibold text-blue-600 hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
