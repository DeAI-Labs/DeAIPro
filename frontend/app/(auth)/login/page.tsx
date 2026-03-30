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
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[32px] border border-white/10 bg-slate-950/85 p-10 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="space-y-6">
              <div className="flex flex-col gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">
                  DeAI Nexus Pro
                </span>
                <h1 className="text-4xl font-black tracking-tight text-white">Secure access to advanced subnet intelligence.</h1>
                <p className="max-w-md text-base leading-7 text-slate-300">
                  Sign in to explore TAO market analytics, institutional scorecards, and live subnet intelligence curated for analysts and investors.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-white/5 p-5">
                  <p className="text-sm uppercase text-slate-400">Live dashboards</p>
                  <p className="mt-3 font-semibold text-white">Cross-market KPI monitoring, TAO price, and subnet performance.</p>
                </div>
                <div className="rounded-3xl bg-white/5 p-5">
                  <p className="text-sm uppercase text-slate-400">Guest access</p>
                  <p className="mt-3 font-semibold text-white">Request access if your account is not yet approved.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[32px] border border-white/10 bg-white/10 p-10 shadow-[0_20px_80px_rgba(0,0,0,0.25)] backdrop-blur-xl">
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-semibold text-white">Sign in</h2>
                <p className="mt-2 text-sm text-slate-300">Use your email and password or continue with Google.</p>
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
                    className="w-full rounded-3xl border border-white/10 bg-slate-950/90 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
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
                    className="w-full rounded-3xl border border-white/10 bg-slate-950/90 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-3xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
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
                className="w-full rounded-3xl border border-white/10 bg-slate-900/90 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Please wait…' : 'Sign in with Google'}
              </button>

              <div className="pt-4 text-sm text-slate-400">
                Don&apos;t have access yet?{' '}
                <Link href="/access-request" className="font-semibold text-cyan-300 hover:text-cyan-200">
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
