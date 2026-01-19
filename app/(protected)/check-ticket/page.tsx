'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import TicketList from '@/components/TicketList';
import { authClient } from '@/lib/auth-client';

export default function CheckTicketPage() {
  const searchParams = useSearchParams();
  const [initialTicketId, setInitialTicketId] = useState<string | null>(null);
  const sessionState = authClient.useSession();
  const requesterName = useMemo(() => sessionState?.data?.user?.name ?? null, [sessionState?.data?.user?.name]);

  useEffect(() => {
    const ticketParam = searchParams.get('ticket');
    if (ticketParam) {
      const normalized = ticketParam.replace(/^HRB-/i, '');
      setInitialTicketId(normalized);
    } else {
      setInitialTicketId(null);
    }
  }, [searchParams]);

  return (
    <div className="px-8 py-8 md:px-12 md:py-10">
      <div className="w-full bg-white/60 backdrop-blur-xl backdrop-saturate-150 rounded-3xl p-8 border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] font-outfit">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">Ticket Overview</h2>
          <p className="text-base text-gray-600 max-w-2xl">
             Track your requested tickets and system updates in real-time.
          </p>
        </div>
        <TicketList initialTicketIdFilter={initialTicketId ?? undefined} initialRequesterName={requesterName ?? undefined} />
      </div>
    </div>
  );
}
