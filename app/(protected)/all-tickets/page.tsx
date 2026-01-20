'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

function AllTicketsRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const ticket = searchParams.get('ticket');
    if (ticket) {
      router.replace(`/check-ticket?ticket=${ticket}`);
    } else {
      router.replace('/check-ticket');
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center">
      <div className="text-center glass-panel rounded-2xl px-6 py-4 border border-white/60">
        <p className="text-slate-500">Redirecting...</p>
      </div>
    </div>
  );
}

export default function AllTicketsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center glass-panel rounded-2xl px-6 py-4 border border-white/60">
            <p className="text-slate-500">Loading...</p>
          </div>
        </div>
      }
    >
      <AllTicketsRedirect />
    </Suspense>
  );
}

