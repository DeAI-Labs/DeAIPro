'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import './dashboard.css';
import { dashboardHtml } from './dashboard-html';

export default function NexusProDashboard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    ;(window as any).__DEAI_FIREBASE_CONFIG__ = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
    setMounted(true);
  }, []);

  return (
    <>
      <Script src="https://cdn.jsdelivr.net/npm/chart.js" strategy="beforeInteractive" />
      <div 
        dangerouslySetInnerHTML={{ __html: dashboardHtml }} 
        suppressHydrationWarning 
      />
      {mounted && (
        <Script src="/dashboard-script.js" strategy="afterInteractive" type="module" />
      )}
    </>
  );
}
