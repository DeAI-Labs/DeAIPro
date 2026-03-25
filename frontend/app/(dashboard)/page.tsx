'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import './dashboard.css';
import { dashboardHtml } from './dashboard-html';

export default function NexusProDashboard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <div 
        dangerouslySetInnerHTML={{ __html: dashboardHtml }} 
        suppressHydrationWarning 
      />
      {mounted && (
        <Script 
          src="https://cdn.jsdelivr.net/npm/chart.js" 
          strategy="afterInteractive" 
          onLoad={() => {
            const s = document.createElement('script');
            s.src = '/dashboard-script.js';
            document.body.appendChild(s);
          }}
        />
      )}
    </>
  );
}
