'use client';

import Link from 'next/link';
import { useState } from 'react';
import { requestAccess } from '@/src/services/api';

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
      const response = await requestAccess(email.trim().toLowerCase());
      setMessage(response?.message || `Access request submitted for ${email}.`);
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(0,240,255,0.18),transparent_35%),linear-gradient(180deg,#02040a_0%,#09101d_100%)] px-4 py-16 text-white">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10">
        <section className="rounded-[32px] border border-white/10 bg-slate-950/85 p-10 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="space-y-6 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">
              Guest request
            </span>
            <h1 className="text-4xl font-black tracking-tight text-white">Request guest access</h1>
            <p className="mx-auto max-w-2xl text-base leading-7 text-slate-300">
              Submit your email and we&apos;ll review your access request. Once approved, you can log in and explore the DeAI Nexus Pro dashboard.
            </p>
          </div>

          <div className="mt-10 rounded-[28px] border border-white/10 bg-white/10 p-8 shadow-[0_20px_80px_rgba(0,0,0,0.2)]">
            {message ? (
              <div className="rounded-3xl bg-emerald-500/10 p-4 text-sm text-emerald-200">
                {message}
              </div>
            ) : null}

            {error ? (
              <div className="rounded-3xl bg-rose-500/10 p-4 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-300">Email address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="w-full rounded-3xl border border-white/10 bg-slate-950/90 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-3xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Submitting…' : 'Request access'}
              </button>
            </form>

            <div className="mt-6 border-t border-white/10 pt-4 text-sm text-slate-400">
              Already have access?{' '}
              <Link href="/login" className="font-semibold text-cyan-300 hover:text-cyan-200">
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
