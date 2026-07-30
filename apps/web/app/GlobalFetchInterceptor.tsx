'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function GlobalFetchInterceptor({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        // If the API returns 401 (Unauthorized) and we are not already on the login page
        if (response.status === 401 && args[0]?.toString().includes('/api/backend/')) {
          if (pathname !== '/login' && pathname !== '/register') {
            router.push('/login');
          }
        }

        // If the API returns 402 (Payment Required)
        if (response.status === 402 && args[0]?.toString().includes('/api/backend/')) {
          alert("Action refusée : Votre abonnement est inactif. Veuillez renouveler votre abonnement pour continuer.");
        }
        
        // If the API returns 502/503/504 (Server restarting/down), we just pass the response back
        // The components will handle it gracefully (e.g. by showing a network error text instead of crashing)
        
        return response;
      } catch (error) {
        // Network errors (e.g. server completely unreachable)
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [router, pathname]);

  return <>{children}</>;
}
