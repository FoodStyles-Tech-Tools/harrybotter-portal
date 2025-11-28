'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Ticket Overview</h2>
      </div>
      <TicketList initialTicketIdFilter={initialTicketId ?? undefined} initialRequesterName={requesterName ?? undefined} />
    </motion.div>
  );
}
