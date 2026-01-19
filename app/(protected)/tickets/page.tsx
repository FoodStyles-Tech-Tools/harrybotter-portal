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
    <div className="flex-1 w-full flex flex-col font-outfit">
      <div className="flex-1 bg-white/40 backdrop-blur-xl overflow-hidden">
        <TicketList />
      </div>
    </div>
  );
}
