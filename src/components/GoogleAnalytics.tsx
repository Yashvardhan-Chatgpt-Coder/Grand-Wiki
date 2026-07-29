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

  // Initialize Google Analytics
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    
    function gtag(...args: any[]) {
      window.dataLayer.push(args);
    }
    
    window.gtag = gtag;

    // Initialize GA4
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, {
      page_path: location.pathname,
    });

    // Load GA script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector(
        `script[src*="googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"]`
      );
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []); // Run once on mount

  // Track page views on route change
  useEffect(() => {
    if (typeof window === 'undefined' || !window.gtag) return;

    // Send page view to GA4
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: location.pathname,
    });
  }, [location.pathname]); // Run on every route change

  return null; // This component doesn't render anything
}
