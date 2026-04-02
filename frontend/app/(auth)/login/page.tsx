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

    if (!auth) {
      setError('Authentication is not configured. Please set Firebase environment variables.');
      setLoading(false);
      return;
    }

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

    if (!auth || !googleProvider) {
      setError('Authentication is not configured. Please set Firebase environment variables.');
      setLoading(false);
      return;
    }

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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(0,240,255,0.18),transparent_35%),linear-gradient(180deg,#02040a_0%,#09101d_100%)] px-4 py-16 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-[32px] border border-white/10 bg-slate-950/90 p-10 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="space-y-8">
              <div className="flex flex-col gap-4">
                <span className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">
                  DeAI Nexus Pro
                </span>
                <h1 className="text-5xl font-black tracking-tight text-white leading-[1.05]">Secure access to advanced subnet intelligence.</h1>
                <p className="max-w-xl text-lg leading-8 text-slate-300">
                  Sign in to explore TAO market analytics, institutional scorecards, and live subnet intelligence curated for analysts and investors.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-[0_20px_50px_rgba(255,255,255,0.05)]">
                  <p className="text-xs uppercase tracking-[0.32em] text-slate-400">Live dashboards</p>
                  <p className="mt-4 text-sm font-semibold text-white leading-7">Cross-market KPI monitoring, TAO price, and subnet performance.</p>
                </div>
                <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-[0_20px_50px_rgba(255,255,255,0.05)]">
                  <p className="text-xs uppercase tracking-[0.32em] text-slate-400">Guest access</p>
                  <p className="mt-4 text-sm font-semibold text-white leading-7">Request access if your account is not yet approved.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto w-full max-w-xl rounded-[32px] border border-white/10 bg-white/10 p-10 shadow-[0_30px_90px_rgba(0,0,0,0.22)] backdrop-blur-xl">
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-semibold text-white">Sign in</h2>
                <p className="mt-3 text-base text-slate-300">Sign in with email or continue with Google for faster access.</p>
              </div>

              {error ? (
                <div className="rounded-3xl bg-rose-500/10 p-4 text-sm text-rose-200">
                  {error}
                </div>
              ) : null}

              <form className="space-y-4" onSubmit={signInWithEmail}>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-slate-300">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className="w-full rounded-3xl border border-white/10 bg-slate-950/90 px-4 py-4 text-base text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-slate-300">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    className="w-full rounded-3xl border border-white/10 bg-slate-950/90 px-4 py-4 text-base text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-[28px] bg-cyan-400 px-5 py-4 text-base font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Signing in…' : 'Sign in with email'}
                </button>
              </form>

              <div className="flex items-center gap-3 pt-4 text-sm text-slate-400">
                <span className="h-px flex-1 bg-white/10"></span>
                <span>or continue with</span>
                <span className="h-px flex-1 bg-white/10"></span>
              </div>

              <button
                type="button"
                onClick={signInWithGoogle}
                disabled={loading}
                className="w-full rounded-[28px] border border-white/10 bg-slate-900/95 px-5 py-4 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="inline-flex items-center justify-center gap-3">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.6 10.23c0-.68-.06-1.34-.16-1.98H10v3.76h5.4c-.23 1.24-.94 2.28-1.99 2.98v2.48h3.22c1.88-1.74 2.97-4.28 2.97-7.24z" fill="#4285F4"/>
                    <path d="M10 20c2.7 0 4.97-.9 6.63-2.44l-3.22-2.48c-.9.6-2.06.95-3.41.95-2.62 0-4.84-1.77-5.64-4.14H1.01v2.59C2.64 17.9 6.03 20 10 20z" fill="#34A853"/>
                    <path d="M4.36 11.89c-.2-.6-.32-1.24-.32-1.89s.12-1.29.32-1.89V5.52H1.01A9.99 9.99 0 0 0 0 10.0c0 1.6.38 3.12 1.01 4.48l3.35-2.59z" fill="#FBBC05"/>
                    <path d="M10 3.98c1.47 0 2.78.5 3.82 1.48l2.86-2.86C14.96 1.02 12.7 0 10 0 6.03 0 2.64 2.1 1.01 5.52l3.35 2.59C5.16 5.75 7.38 3.98 10 3.98z" fill="#EA4335"/>
                  </svg>
                  {loading ? 'Please wait…' : 'Sign in with Google'}
                </span>
              </button>

              <div className="pt-4 text-sm text-slate-400">
                Don&apos;t have access yet?{' '}
                <Link href="/access-request" className="font-semibold text-cyan-300 hover:text-cyan-200 underline underline-offset-4">
                  Request access
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
