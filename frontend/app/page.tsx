'use client';

import { useRouter } from 'next/navigation';
import LandingPage from '@/src/pages/LandingPage';

export default function Home() {
  const router = useRouter();

  return <LandingPage onSignIn={() => router.push('/login')} />;
}
