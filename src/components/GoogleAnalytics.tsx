import { useEffect } from 'react';
import { useLocation } from '@tanstack/react-router';

const GA_MEASUREMENT_ID = 'G-H9S3L43WCX';

// Declare gtag function type
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export function GoogleAnalytics() {
  const location = useLocation();

  // Track page views on route change
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (typeof window.gtag === 'function') {
      window.gtag('config', GA_MEASUREMENT_ID, {
        page_path: location.pathname,
      });
    }
  }, [location.pathname]); // Run on every route change

  return null; // This component doesn't render anything
}
