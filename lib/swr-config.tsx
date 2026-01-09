'use client';

import { SWRConfig } from 'swr';
import type { ReactNode } from 'react';

/**
 * SWR Configuration Provider
 * Provides aggressive client-side caching to reduce API calls and Edge Requests
 */
export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        // Deduplicate requests within 2 seconds
        dedupingInterval: 2000,
        // Cache data for 10 minutes
        focusThrottleInterval: 600000,
        // Revalidate on focus (but throttled)
        revalidateOnFocus: true,
        // Don't revalidate on reconnect (reduce requests)
        revalidateOnReconnect: false,
        // Retry on error (but limited)
        errorRetryCount: 2,
        errorRetryInterval: 5000,
        // Keep previous data while revalidating
        keepPreviousData: true,
        // Default fetcher
        fetcher: (url: string) => fetch(url).then((res) => res.json()),
      }}
    >
      {children}
    </SWRConfig>
  );
}
