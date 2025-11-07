'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

// Force dynamic rendering to avoid prerendering issues
export const dynamic = 'force-dynamic';

function AllTicketsRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Get the ticket parameter from the URL
    const ticket = searchParams.get('ticket');
    
    // Redirect to home page with the ticket parameter
    if (ticket) {
      router.replace(`/?ticket=${ticket}`);
    } else {
      router.replace('/');
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}

export default function AllTicketsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AllTicketsRedirect />
    </Suspense>
  );
}

