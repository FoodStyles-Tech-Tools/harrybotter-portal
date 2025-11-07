'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function AllTicketsPage() {
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

